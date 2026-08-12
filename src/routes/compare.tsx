import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AccountBar } from "@/components/event-chrome";
import { EventPanel } from "@/components/event-panel";
import { CATEGORIES, cardsByCategory, type CategoryId } from "@/lib/cards";
import { qtyOf, useTracker } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare Accounts — Clash of Cards Tracker" },
      {
        name: "description",
        content:
          "See which of your 5 Clash of Clans accounts own or are missing each Clash of Cards event card.",
      },
      { property: "og:title", content: "Compare Accounts — Clash of Cards Tracker" },
      {
        property: "og:description",
        content: "Card-by-card ownership across all five accounts, with missing-account lists.",
      },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const t = useTracker();
  const [cat, setCat] = useState<CategoryId>("elixir");
  const [onlyIncomplete, setOnlyIncomplete] = useState(false);

  const rows = cardsByCategory(cat).map((card) => {
    const per = t.data.accounts.map((a) => ({
      ...a,
      qty: qtyOf(t.data, a.account_id, card.card_id),
    }));
    return { card, per, owners: per.filter((p) => p.qty > 0).length };
  });
  const visible = onlyIncomplete ? rows.filter((r) => r.owners < 5) : rows;

  return (
    <main className="min-h-screen px-3 py-5 sm:px-6">
      <div className="mx-auto mb-4 w-full max-w-6xl">
        <AccountBar data={t.data} selected={t.selected} onSelect={t.setSelected} />
      </div>

      <EventPanel title="Compare Accounts" subtitle="Who owns what across all 5 accounts">
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={cn(
                "text-game rounded-lg border-2 px-3 py-1.5 text-xs sm:text-sm",
                cat === c.id
                  ? "border-gold-deep bg-gold text-ink"
                  : "border-panel-edge bg-secondary text-foreground",
              )}
            >
              {c.name}
            </button>
          ))}
          <button
            onClick={() => setOnlyIncomplete((v) => !v)}
            className={cn(
              "text-game ml-auto rounded-lg border-2 px-3 py-1.5 text-xs sm:text-sm",
              onlyIncomplete
                ? "border-gold-deep bg-gold text-ink"
                : "border-panel-edge bg-secondary text-foreground",
            )}
          >
            {onlyIncomplete ? "Showing incomplete" : "Show all cards"}
          </button>
        </div>

        <div className="bg-parchment border-panel-edge mt-3 space-y-2 rounded-xl border-[3px] p-3">
          {visible.length === 0 && (
            <p className="text-ink py-6 text-center font-bold">
              Every account owns all of these cards.
            </p>
          )}
          {visible.map(({ card, per, owners }) => {
            const missing = per.filter((p) => p.qty === 0).map((p) => p.name);
            return (
              <div
                key={card.card_id}
                className="border-panel-edge/40 grid grid-cols-1 items-center gap-2 rounded-lg border-2 bg-panel/70 px-3 py-2 md:grid-cols-[14rem_1fr_auto]"
              >
                <div className="text-game text-ink truncate text-sm">{card.name}</div>
                <div className="flex flex-wrap gap-1.5">
                  {per.map((p) => (
                    <span
                      key={p.account_id}
                      title={p.name}
                      className={cn(
                        "rounded-md border-2 px-2 py-0.5 text-xs font-bold",
                        p.qty > 0
                          ? "border-gold-deep bg-gold text-ink"
                          : "border-panel-edge bg-secondary/70 text-foreground/70",
                      )}
                    >
                      <span className="max-w-[7rem] truncate">{p.name}</span>{" "}
                      {p.qty > 0 ? `✓ x${p.qty}` : "—"}
                    </span>
                  ))}
                </div>
                <div className="text-ink text-xs font-bold md:text-right">
                  <div>Owned by {owners}/5</div>
                  {missing.length > 0 && (
                    <div className="text-ink/65">Missing: {missing.join(", ")}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </EventPanel>
    </main>
  );
}
