import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
          "Manage accounts, reset collections, and export or import your Clash of Cards tracker data as JSON.",
      },
      { property: "og:title", content: "Settings — Clash of Cards Tracker" },
      {
        property: "og:description",
        content: "Add, delete, rename accounts, reset data, export and import your card collection backups.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const t = useTracker();
  const [status, setStatus] = useState("");
  const [newAccName, setNewAccName] = useState("");

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

  const handleAddAccount = () => {
    t.addAccount(newAccName);
    setNewAccName("");
    setStatus("Added new account.");
  };

  return (
    <main className="min-h-screen px-3 py-5 sm:px-6">
      <div className="mx-auto mb-4 w-full max-w-6xl">
        <AccountBar
          data={t.data}
          selected={t.selected}
          onSelect={t.setSelected}
          onAddAccount={handleAddAccount}
        />
      </div>

      <EventPanel title="Settings" subtitle="Manage accounts, backups and resets">
        <div className="bg-parchment border-panel-edge space-y-4 rounded-xl border-[3px] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-game text-ink text-lg">Accounts ({t.data.accounts.length})</h2>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="New account name…"
                value={newAccName}
                onChange={(e) => setNewAccName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddAccount()}
                className="border-panel-edge text-ink rounded-lg border-2 bg-input px-3 py-1.5 text-xs font-bold outline-none sm:text-sm focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={handleAddAccount}
                className="text-game border-gold-deep bg-gold text-ink rounded-lg border-2 px-3 py-1.5 text-xs sm:text-sm active:translate-y-0.5"
              >
                + Add Account
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {t.data.accounts.map((a) => {
              const p = totalProgress(t.data, a.account_id);
              return (
                <div
                  key={a.account_id}
                  className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_auto_auto_auto]"
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
                    Reset
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete account "${a.name}"? This action cannot be undone.`)) {
                        t.deleteAccount(a.account_id as AccountId);
                        setStatus(`Deleted account "${a.name}".`);
                      }
                    }}
                    disabled={t.data.accounts.length <= 1}
                    className="text-game rounded-lg border-2 border-destructive bg-destructive/80 px-3 py-2 text-xs text-destructive-foreground disabled:opacity-40"
                  >
                    Delete
                  </button>
                </div>
              );
            })}
          </div>
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
                if (confirm("Erase all data for all accounts?")) {
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
