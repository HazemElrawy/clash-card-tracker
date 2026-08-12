import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { scanScreenshot } from "@/lib/scan.functions";
import type { AccountId, AppData } from "@/lib/store";
import { CARDS } from "@/lib/cards";

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
  const targetRef = useRef<AccountId | null>(null);
  const [busy, setBusy] = useState<AccountId | null>(null);
  const [status, setStatus] = useState("");

  const pick = (id: AccountId) => {
    targetRef.current = id;
    inputRef.current?.click();
  };

  const handleFiles = async (files: File[]) => {
    const account = targetRef.current;
    if (!account || files.length === 0) return;
    setBusy(account);
    setStatus(`Reading ${files.length} screenshot${files.length > 1 ? "s" : ""}…`);
    try {
      const merged = new Map<string, number>();
      for (const file of files) {
        const imageDataUrl = await toDataUrl(file);
        const res = await scan({ data: { imageDataUrl } });
        for (const c of res.cards) merged.set(c.card_id, Math.max(merged.get(c.card_id) ?? 0, c.quantity));
      }
      const cards = [...merged].map(([card_id, quantity]) => ({ card_id, quantity }));
      onApply(account, cards);
      const name = data.accounts.find((a) => a.account_id === account)?.name ?? account;
      setStatus(
        cards.length
          ? `Added ${cards.length} card${cards.length > 1 ? "s" : ""} to ${name} (of ${CARDS.length}).`
          : `No owned cards recognised in that screenshot.`,
      );
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Scan failed.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="bg-parchment border-panel-edge mt-3 rounded-xl border-[3px] p-3">
      <h2 className="text-game text-ink text-sm sm:text-base">Import from phone screenshots</h2>
      <p className="text-ink/70 mt-0.5 text-xs font-bold">
        Pick an account, then choose one or more event screenshots. Detected cards are marked as
        collected.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {data.accounts.map((a) => (
          <button
            key={a.account_id}
            disabled={busy !== null}
            onClick={() => pick(a.account_id)}
            className="text-game border-gold-deep bg-gold text-ink max-w-[12rem] truncate rounded-lg border-2 px-3 py-1.5 text-xs transition-transform active:translate-y-0.5 disabled:opacity-60 sm:text-sm"
          >
            {busy === a.account_id ? "Scanning…" : `📷 ${a.name}`}
          </button>
        ))}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          void handleFiles(files);
        }}
      />
      {status && <p className="text-ink mt-2 text-xs font-bold">{status}</p>}
    </div>
  );
}
