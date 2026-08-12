import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { scanScreenshot } from "@/lib/scan.functions";
import type { AccountId, AppData } from "@/lib/store";
import { CARDS } from "@/lib/cards";

const AI_KEY_STORAGE = "coc-cards-ai-key";

async function toDataUrl(file: File, max = 1600): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export function ScreenshotImport({
  data,
  onApply,
}: {
  data: AppData;
  onApply: (accountId: AccountId, cards: { card_id: string; quantity: number }[]) => void;
}) {
  const scan = useServerFn(scanScreenshot);
  const inputRef = useRef<HTMLInputElement>(null);
  const ocrInputRef = useRef<HTMLInputElement>(null);
  const targetRef = useRef<AccountId | null>(null);
  const [busy, setBusy] = useState<AccountId | null>(null);
  const [ocrBusy, setOcrBusy] = useState<AccountId | null>(null);
  const [status, setStatus] = useState("");
  const [ocrProgress, setOcrProgress] = useState<{ pct: number; msg: string } | null>(null);
  const [userApiKey, setUserApiKey] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem(AI_KEY_STORAGE) ?? "";
    setUserApiKey(savedKey);
  }, []);

  const saveApiKey = (key: string) => {
    setUserApiKey(key);
    localStorage.setItem(AI_KEY_STORAGE, key.trim());
  };

  const pick = (id: AccountId, ref: React.RefObject<HTMLInputElement | null>) => {
    targetRef.current = id;
    ref.current?.click();
  };

  // ── AI-based scan (server function → Gemini/OpenAI/Lovable) ──
  const handleAiFiles = async (files: File[]) => {
    const account = targetRef.current;
    if (!account || files.length === 0) return;
    setBusy(account);
    setStatus(`Reading ${files.length} screenshot${files.length > 1 ? "s" : ""}…`);
    try {
      const merged = new Map<string, number>();
      const currentKey = localStorage.getItem(AI_KEY_STORAGE) ?? userApiKey;

      for (const file of files) {
        const imageDataUrl = await toDataUrl(file);
        const res = await scan({
          data: {
            imageDataUrl,
            userApiKey: currentKey.trim() || undefined,
          },
        });
        for (const c of res.cards)
          merged.set(c.card_id, Math.max(merged.get(c.card_id) ?? 0, c.quantity));
      }
      const cards = [...merged].map(([card_id, quantity]) => ({ card_id, quantity }));
      onApply(account, cards);
      const name = data.accounts.find((a) => a.account_id === account)?.name ?? account;
      setStatus(
        cards.length
          ? `AI: Added ${cards.length} card${cards.length > 1 ? "s" : ""} to ${name} (of ${CARDS.length}).`
          : `No owned cards recognised in that screenshot.`,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Scan failed.";
      setStatus(msg);
      if (msg.toLowerCase().includes("not configured") || msg.toLowerCase().includes("api key")) {
        setShowKeyInput(true);
      }
    } finally {
      setBusy(null);
    }
  };

  // ── Offline OCR scan (Tesseract.js, fully client-side) ──
  const handleOcrFiles = async (files: File[]) => {
    const account = targetRef.current;
    if (!account || files.length === 0) return;
    setOcrBusy(account);
    setOcrProgress({ pct: 0, msg: "Loading OCR engine…" });
    setStatus("");
    try {
      // Lazy-import so Tesseract is only loaded when needed
      const { scanImageWithOcr } = await import("@/lib/scan-ocr");
      const merged = new Map<string, number>();

      for (const file of files) {
        const result = await scanImageWithOcr(file, (pct, msg) => {
          setOcrProgress({ pct, msg });
        });
        for (const c of result.cards)
          merged.set(c.card_id, Math.max(merged.get(c.card_id) ?? 0, c.quantity));
      }

      const cards = [...merged].map(([card_id, quantity]) => ({ card_id, quantity }));
      onApply(account, cards);
      const name = data.accounts.find((a) => a.account_id === account)?.name ?? account;
      setStatus(
        cards.length
          ? `OCR: Added ${cards.length} card${cards.length > 1 ? "s" : ""} to ${name} (of ${CARDS.length}). Note: OCR accuracy may vary — review and adjust manually if needed.`
          : `OCR: No card names recognised. Try a clearer screenshot.`,
      );
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "OCR scan failed.");
    } finally {
      setOcrBusy(null);
      setOcrProgress(null);
    }
  };

  return (
    <div className="bg-parchment border-panel-edge mt-3 rounded-xl border-[3px] p-3 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-game text-ink text-sm sm:text-base">Import from phone screenshots</h2>
          <p className="text-ink/70 mt-0.5 text-xs font-bold">
            Pick an account below, then choose one or more event screenshots.
          </p>
        </div>
        <button
          onClick={() => setShowKeyInput((v) => !v)}
          className="text-xs font-bold text-ink/70 underline hover:text-ink shrink-0"
        >
          {showKeyInput ? "Hide Key Settings" : "⚙️ AI Config"}
        </button>
      </div>

      {/* API Key Config */}
      {(showKeyInput || !userApiKey) && (
        <div className="border-panel-edge/50 bg-secondary/40 rounded-lg border-2 p-2.5 space-y-1.5">
          <label className="text-game text-ink text-xs block">
            Gemini API Key (for AI scanning — optional):
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="Paste Gemini API Key…"
              value={userApiKey}
              onChange={(e) => saveApiKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setShowKeyInput(false)}
              className="border-panel-edge text-ink flex-1 rounded-lg border-2 bg-input px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring"
            />
            {userApiKey && (
              <button
                onClick={() => saveApiKey("")}
                className="text-xs text-destructive font-bold px-2 border border-destructive/50 rounded-md"
              >
                Clear
              </button>
            )}
          </div>
          <p className="text-[11px] text-ink/65 font-bold">
            Get a free key at{" "}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="underline text-gold-deep"
            >
              aistudio.google.com
            </a>
            . Or skip this and use the offline OCR below.
          </p>
        </div>
      )}

      {/* AI Scan buttons */}
      <div>
        <p className="text-game text-ink text-xs mb-1.5 flex items-center gap-1">
          <span>🤖 AI Scan</span>
          <span className="text-ink/50 font-bold">(requires API key)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {data.accounts.map((a) => (
            <button
              key={a.account_id}
              disabled={busy !== null || ocrBusy !== null}
              onClick={() => pick(a.account_id, inputRef)}
              className="text-game border-gold-deep bg-gold text-ink max-w-[12rem] truncate rounded-lg border-2 px-3 py-1.5 text-xs transition-transform active:translate-y-0.5 disabled:opacity-60 sm:text-sm"
            >
              {busy === a.account_id ? "Scanning…" : `📷 ${a.name}`}
            </button>
          ))}
        </div>
      </div>

      {/* Offline OCR buttons */}
      <div>
        <p className="text-game text-ink text-xs mb-1.5 flex items-center gap-1">
          <span>🔍 Offline OCR Scan</span>
          <span className="text-ink/50 font-bold">(no API key needed — runs in your browser)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {data.accounts.map((a) => (
            <button
              key={a.account_id}
              disabled={busy !== null || ocrBusy !== null}
              onClick={() => pick(a.account_id, ocrInputRef)}
              className="text-game border-panel-edge bg-secondary text-foreground max-w-[12rem] truncate rounded-lg border-2 px-3 py-1.5 text-xs transition-transform active:translate-y-0.5 disabled:opacity-60 sm:text-sm hover:brightness-110"
            >
              {ocrBusy === a.account_id ? "Scanning…" : `🔍 ${a.name}`}
            </button>
          ))}
        </div>
      </div>

      {/* OCR Progress bar */}
      {ocrProgress && (
        <div className="space-y-1">
          <p className="text-ink text-xs font-bold">{ocrProgress.msg}</p>
          <div className="border-panel-edge relative h-4 overflow-hidden rounded-md border-2 bg-ink/20">
            <div
              className="bg-gold h-full transition-[width] duration-200"
              style={{ width: `${ocrProgress.pct}%` }}
            />
            <span className="text-game absolute inset-0 grid place-items-center text-[10px] text-foreground">
              {ocrProgress.pct}%
            </span>
          </div>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          void handleAiFiles(files);
        }}
      />
      <input
        ref={ocrInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          void handleOcrFiles(files);
        }}
      />

      {status && (
        <p className="text-ink text-xs font-bold border-t border-panel-edge/40 pt-2">{status}</p>
      )}
    </div>
  );
}
