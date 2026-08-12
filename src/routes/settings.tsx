import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AccountBar } from "@/components/event-chrome";
import { EventPanel } from "@/components/event-panel";
import { totalProgress, useTracker, type AccountId } from "@/lib/store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Clash of Cards Tracker" },
      {
        name: "description",
        content:
          "Rename your accounts, reset collections, and export or import your Clash of Cards tracker data as JSON.",
      },
      { property: "og:title", content: "Settings — Clash of Cards Tracker" },
      {
        property: "og:description",
        content: "Rename accounts, reset data, export and import your card collection backups.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const t = useTracker();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("");

  const exportData = () => {
    const blob = new Blob([JSON.stringify(t.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clash-of-cards-tracker-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus("Exported backup file.");
  };

  const importFile = async (file: File) => {
    try {
      t.importData(JSON.parse(await file.text()));
      setStatus("Import complete.");
    } catch {
      setStatus("Import failed — that file is not valid tracker JSON.");
    }
  };

  return (
    <main className="min-h-screen px-3 py-5 sm:px-6">
      <div className="mx-auto mb-4 w-full max-w-6xl">
        <AccountBar data={t.data} selected={t.selected} onSelect={t.setSelected} />
      </div>

      <EventPanel title="Settings" subtitle="Accounts, backups and resets">
        <div className="bg-parchment border-panel-edge space-y-3 rounded-xl border-[3px] p-4">
          <h2 className="text-game text-ink text-lg">Accounts</h2>
          {t.data.accounts.map((a) => {
            const p = totalProgress(t.data, a.account_id);
            return (
              <div
                key={a.account_id}
                className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_auto_auto]"
              >
                <input
                  value={a.name}
                  onChange={(e) => t.renameAccount(a.account_id as AccountId, e.target.value)}
                  className="border-panel-edge text-ink rounded-lg border-2 bg-input px-3 py-2 font-bold outline-none focus:ring-2 focus:ring-ring"
                />
                <span className="text-ink text-sm font-bold">
                  {p.owned}/{p.total} cards
                </span>
                <button
                  onClick={() => t.resetAccount(a.account_id as AccountId)}
                  className="text-game border-panel-edge bg-secondary rounded-lg border-2 px-3 py-2 text-xs text-foreground"
                >
                  Reset account
                </button>
              </div>
            );
          })}
        </div>

        <div className="bg-parchment border-panel-edge mt-3 space-y-3 rounded-xl border-[3px] p-4">
          <h2 className="text-game text-ink text-lg">Backup</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportData}
              className="text-game border-gold-deep bg-gold text-ink rounded-lg border-2 px-4 py-2 text-sm"
            >
              Export data
            </button>
            <button
              onClick={() => {
                if (confirm("Erase all data for all 5 accounts?")) {
                  t.resetAll();
                  setStatus("All data reset.");
                }
              }}
              className="text-game rounded-lg border-2 border-destructive bg-destructive px-4 py-2 text-sm text-destructive-foreground"
            >
              Reset all data
            </button>
          </div>
          {status && <p className="text-ink text-sm font-bold">{status}</p>}
          <p className="text-ink/70 text-xs font-bold">
            Data is stored locally in this browser and saves instantly on every change. To fill in a
            collection, upload phone screenshots per account on the Collection page.
          </p>
        </div>
      </EventPanel>
    </main>
  );
}
