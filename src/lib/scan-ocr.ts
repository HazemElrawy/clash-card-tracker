import { createWorker } from "tesseract.js";
import { CARDS } from "./cards";

export type ClientScanResult = {
  cards: { card_id: string; quantity: number }[];
  unmatched: string[];
  rawText: string;
};

// ---------- fuzzy matching helpers ----------

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

/** Simple Levenshtein distance */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i]![j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1]![j - 1]!
          : 1 + Math.min(dp[i - 1]![j]!, dp[i]![j - 1]!, dp[i - 1]![j - 1]!);
    }
  }
  return dp[m]![n]!;
}

/** Returns true if candidate fuzzy-matches target within threshold */
function fuzzyMatch(candidate: string, target: string, threshold = 2): boolean {
  const a = norm(candidate);
  const b = norm(target);
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  const dist = levenshtein(a, b);
  return dist <= Math.max(threshold, Math.floor(b.length * 0.25));
}

// Build a sorted-by-length list so multi-word names are checked first
const SORTED_CARDS = [...CARDS].sort((a, b) => b.name.length - a.name.length);

/** Try to find a card matching the given text snippet */
function findCard(snippet: string): { card_id: string; name: string } | undefined {
  const normed = norm(snippet);
  if (normed.length < 3) return undefined;

  // Exact normalized match first
  for (const c of SORTED_CARDS) {
    if (norm(c.name) === normed) return c;
  }
  // Substring match
  for (const c of SORTED_CARDS) {
    const cn = norm(c.name);
    if (normed.includes(cn) || cn.includes(normed)) return c;
  }
  // Fuzzy match
  for (const c of SORTED_CARDS) {
    if (fuzzyMatch(normed, norm(c.name))) return c;
  }
  return undefined;
}

/** Parse a quantity hint like "x2", "×2", "2×" near the text */
function extractQty(tokens: string[], idx: number): number {
  const window = tokens.slice(Math.max(0, idx - 2), idx + 3).join(" ");
  const m = window.match(/[x×*](\d+)|(\d+)[x×*]/i);
  return m ? Math.max(1, parseInt(m[1] ?? m[2] ?? "1", 10)) : 1;
}

// ---------- main OCR function ----------

export type OcrProgressCallback = (pct: number, status: string) => void;

export async function scanImageWithOcr(
  file: File | string,
  onProgress?: OcrProgressCallback,
): Promise<ClientScanResult> {
  const worker = await createWorker("eng", 1, {
    logger: (m) => {
      if (m.status === "recognizing text" && onProgress) {
        onProgress(Math.round((m.progress ?? 0) * 100), "Reading text…");
      } else if (onProgress && m.status) {
        onProgress(0, m.status);
      }
    },
  });

  let rawText = "";
  try {
    const {
      data: { text },
    } = await worker.recognize(file);
    rawText = text;
  } finally {
    await worker.terminate();
  }

  // ---------- Match card names in the extracted text ----------
  const lines = rawText.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const tokens = rawText.split(/[\s,;|\/\\\n]+/).filter((t) => t.length > 1);

  const found = new Map<string, number>();
  const unmatched: string[] = [];

  // Try each line (good for multi-word card names)
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li]!;

    // Try progressively shorter windows within the line
    const words = line.split(/\s+/);
    let matched = false;
    for (let len = Math.min(words.length, 4); len >= 1; len--) {
      for (let start = 0; start <= words.length - len; start++) {
        const snippet = words.slice(start, start + len).join(" ");
        const card = findCard(snippet);
        if (card) {
          const qty = extractQty(tokens, tokens.indexOf(words[start]!));
          found.set(card.card_id, Math.max(found.get(card.card_id) ?? 0, qty));
          matched = true;
          break;
        }
      }
      if (matched) break;
    }

    if (!matched && norm(line).length > 2) {
      unmatched.push(line);
    }
  }

  return {
    cards: [...found].map(([card_id, quantity]) => ({ card_id, quantity })),
    unmatched,
    rawText,
  };
}
