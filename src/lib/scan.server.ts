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

export async function readScreenshot(
  imageDataUrl: string,
  userApiKey?: string,
): Promise<ScanResult> {
  const geminiKey =
    userApiKey?.trim() ||
    process.env["GEMINI_API_KEY"] ||
    process.env["GOOGLE_API_KEY"] ||
    process.env["VITE_GEMINI_API_KEY"];

  const lovableKey = process.env["LOVABLE_API_KEY"];
  const openaiKey = process.env["OPENAI_API_KEY"];

  const names = CARDS.map((c) => c.name).join(", ");
  const systemPrompt =
    "You read Clash of Clans 'Clash of Cards' event screenshots. Return ONLY cards the player actually owns (bright/coloured tiles, not greyed-out or locked ones). If a tile shows a duplicate count like x2, use it as quantity, otherwise 1. Only use names from this list: " +
    names;
  const userPrompt =
    'Return strict JSON: {"cards":[{"name":"Barbarian","quantity":1}]} and nothing else.';

  let rawJsonText = "";

  // 1. Google Gemini API (Recommended for free / local usage)
  if (geminiKey) {
    const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, "");
    const mimeType = imageDataUrl.match(/data:(image\/\w+);/)?.[1] ?? "image/jpeg";

    const candidateModels = [
      "gemini-1.5-flash",
      "gemini-2.0-flash-exp",
      "gemini-1.5-pro",
    ];

    let lastErr = "";
    let success = false;

    for (const model of candidateModels) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: `${systemPrompt}\n\n${userPrompt}` },
                    { inlineData: { mimeType, data: base64Data } },
                  ],
                },
              ],
            }),
          },
        );

        if (res.ok) {
          const data = (await res.json()) as {
            candidates?: { content?: { parts?: { text?: string }[] } }[];
          };
          rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
          success = true;
          break;
        } else {
          const errBody = await res.text().catch(() => "");
          lastErr = `[${model}] (${res.status}) ${errBody}`;
        }
      } catch (err) {
        lastErr = err instanceof Error ? err.message : String(err);
      }
    }

    if (!success) {
      throw new Error(`Gemini Scan failed: ${lastErr}`);
    }
  }
  // 2. Lovable Gateway
  else if (lovableKey) {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
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
    rawJsonText = json.choices?.[0]?.message?.content ?? "";
  }
  // 3. OpenAI API
  else if (openaiKey) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) throw new Error(`OpenAI Scan failed (${res.status}).`);

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    rawJsonText = json.choices?.[0]?.message?.content ?? "";
  } else {
    throw new Error(
      "AI is not configured. Add GEMINI_API_KEY in your .env file or enter a Gemini API Key below.",
    );
  }

  const match = rawJsonText.match(/\{[\s\S]*\}/);
  if (!match) return { cards: [], unmatched: [] };
  let parsed: { cards?: { name: string; quantity?: number }[] };
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    return { cards: [], unmatched: [] };
  }
  return matchCards(Array.isArray(parsed.cards) ? parsed.cards : []);
}
