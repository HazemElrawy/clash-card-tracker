import { CARDS } from "./cards";

export type ScanResult = {
  cards: { card_id: string; quantity: number }[];
  unmatched: string[];
};

const norm = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const LOOKUP = new Map<string, string>();
for (const c of CARDS) {
  LOOKUP.set(norm(c.name), c.card_id);
  LOOKUP.set(norm(`${c.category} ${c.name}`), c.card_id);
}

export function matchCards(
  items: { name: string; quantity?: number }[],
): ScanResult {
  const out = new Map<string, number>();
  const unmatched: string[] = [];
  for (const item of items) {
    const raw = String(item?.name ?? "");
    if (!raw) continue;
    const key = norm(raw);
    const id =
      LOOKUP.get(key) ??
      LOOKUP.get(key.replace(/\bbb\b/g, "").trim()) ??
      CARDS.find((c) => norm(c.name) === key.replace(/\s+/g, " "))?.card_id;
    if (!id) {
      unmatched.push(raw);
      continue;
    }
    const q = Math.max(1, Math.floor(Number(item?.quantity) || 1));
    out.set(id, Math.max(out.get(id) ?? 0, q));
  }
  return {
    cards: [...out].map(([card_id, quantity]) => ({ card_id, quantity })),
    unmatched,
  };
}

export async function readScreenshot(imageDataUrl: string): Promise<ScanResult> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured.");

  const names = CARDS.map((c) => c.name).join(", ");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "You read Clash of Clans 'Clash of Cards' event screenshots. Return ONLY cards the player actually owns (bright/coloured tiles, not greyed-out or locked ones). If a tile shows a duplicate count like x2, use it as quantity, otherwise 1. Only use names from this list: " +
            names,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: 'Return strict JSON: {"cards":[{"name":"Barbarian","quantity":1}]} and nothing else.',
            },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
    }),
  });

  if (res.status === 429) throw new Error("Rate limit reached — try again shortly.");
  if (res.status === 402) throw new Error("AI credits exhausted.");
  if (!res.ok) throw new Error(`Scan failed (${res.status}).`);

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = json.choices?.[0]?.message?.content ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return { cards: [], unmatched: [] };
  let parsed: { cards?: { name: string; quantity?: number }[] };
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    return { cards: [], unmatched: [] };
  }
  return matchCards(Array.isArray(parsed.cards) ? parsed.cards : []);
}
