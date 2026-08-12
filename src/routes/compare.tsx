import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AccountBar } from "@/components/event-chrome";
import { EventPanel } from "@/components/event-panel";
import { CATEGORIES, CARDS, type CategoryId } from "@/lib/cards";
import { qtyOf, useTracker } from "@/lib/store";
import {
  computeTradeSuggestions,
  getAccountSummaries,
} from "@/lib/trade-engine";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Trade Matcher — Clash of Cards Tracker" },
      {
        name: "description",
        content:
          "Find 1-to-1 trade suggestions and surplus card transfers to complete your card collections using duplicate cards across accounts.",
      },
      { property: "og:title", content: "Trade Matcher — Clash of Cards Tracker" },
      {
        property: "og:description",
        content: "Smart duplicate matching and transaction suggestions to complete event collections.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ComparePage,
});

const CATEGORY_COLORS: Record<CategoryId, string> = {
  elixir: "bg-elixir/20 text-elixir border-elixir/50",
  dark: "bg-dark-elixir/20 text-dark-elixir border-dark-elixir/50",
  builder: "bg-builder/20 text-builder border-builder/50",
  super: "bg-super/20 text-super border-super/50",
};

function ComparePage() {
  const t = useTracker();
  const [filterAccount1, setFilterAccount1] = useState<string>("all");
  const [filterAccount2, setFilterAccount2] = useState<string>("all");
  const [selectedCat, setSelectedCat] = useState<CategoryId | "all">("all");
  const [viewTab, setViewTab] = useState<"trades" | "duplicates">("trades");

  const accounts = t.data.accounts;

  const summaries = useMemo(() => getAccountSummaries(t.data), [t.data]);

  const { balancedTrades, surplusTransfers } = useMemo(
    () => computeTradeSuggestions(t.data, filterAccount1, filterAccount2),
    [t.data, filterAccount1, filterAccount2],
  );

  // Apply category filter if set
  const filteredBalancedTrades = useMemo(() => {
    if (selectedCat === "all") return balancedTrades;
    return balancedTrades.filter(
      (bt) => bt.cardA.category === selectedCat || bt.cardB.category === selectedCat,
    );
  }, [balancedTrades, selectedCat]);

  const filteredSurplusTransfers = useMemo(() => {
    if (selectedCat === "all") return surplusTransfers;
    return surplusTransfers.filter((st) => st.card.category === selectedCat);
  }, [surplusTransfers, selectedCat]);

  const completeTrade = (trade: (typeof balancedTrades)[number]) => {
    const aGivesQty = qtyOf(t.data, trade.accountA.account_id, trade.cardA.card_id);
    const bGivesQty = qtyOf(t.data, trade.accountB.account_id, trade.cardB.card_id);
    const aReceivesQty = qtyOf(t.data, trade.accountA.account_id, trade.cardB.card_id);
    const bReceivesQty = qtyOf(t.data, trade.accountB.account_id, trade.cardA.card_id);

    t.setQuantity(trade.accountA.account_id, trade.cardA.card_id, aGivesQty - 1);
    t.setQuantity(trade.accountB.account_id, trade.cardB.card_id, bGivesQty - 1);
    t.setQuantity(trade.accountA.account_id, trade.cardB.card_id, aReceivesQty + 1);
    t.setQuantity(trade.accountB.account_id, trade.cardA.card_id, bReceivesQty + 1);
  };

  return (
    <main className="min-h-screen px-3 py-5 sm:px-6">
      <div className="mx-auto mb-4 w-full max-w-6xl">
        <AccountBar data={t.data} selected={t.selected} onSelect={t.setSelected} />
      </div>

      <EventPanel
        title="Trade & Transaction Matcher"
        subtitle="Complete your collections using duplicate cards across accounts"
      >
        {/* Account Summaries Bar */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
          {summaries.map((s) => (
            <div
              key={s.account.account_id}
              className="bg-parchment border-panel-edge rounded-xl border-[3px] p-2.5 shadow-sm"
            >
              <div className="text-game text-ink truncate text-sm font-bold">{s.account.name}</div>
              <div className="mt-1 space-y-0.5 text-xs">
                <div className="flex justify-between text-ink/80">
                  <span>Owned:</span>
                  <span className="font-bold">{s.ownedCount}/{CARDS.length}</span>
                </div>
                <div className="flex justify-between text-ink/80">
                  <span>Missing:</span>
                  <span className="font-bold text-destructive">{s.missingCount}</span>
                </div>
                <div className="flex justify-between text-ink/80">
                  <span>Duplicates:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    {s.duplicateCount} spares
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Controls & Filters */}
        <div className="bg-parchment border-panel-edge mt-4 rounded-xl border-[3px] p-3 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-game text-ink text-xs sm:text-sm">Compare:</span>
              <select
                value={filterAccount1}
                onChange={(e) => setFilterAccount1(e.target.value)}
                className="border-panel-edge text-ink rounded-lg border-2 bg-input px-2.5 py-1 text-xs font-bold outline-none"
              >
                <option value="all">All Accounts</option>
                {accounts.map((a) => (
                  <option key={a.account_id} value={a.account_id}>
                    {a.name}
                  </option>
                ))}
              </select>

              <span className="text-ink text-xs font-bold">vs</span>

              <select
                value={filterAccount2}
                onChange={(e) => setFilterAccount2(e.target.value)}
                className="border-panel-edge text-ink rounded-lg border-2 bg-input px-2.5 py-1 text-xs font-bold outline-none"
              >
                <option value="all">All Accounts</option>
                {accounts.map((a) => (
                  <option key={a.account_id} value={a.account_id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 rounded-lg border-2 border-panel-edge bg-secondary p-1">
              <button
                onClick={() => setViewTab("trades")}
                className={cn(
                  "text-game rounded-md px-3 py-1 text-xs transition",
                  viewTab === "trades"
                    ? "border-gold-deep bg-gold text-ink"
                    : "text-foreground hover:bg-background/50",
                )}
              >
                Trade Suggestions
              </button>
              <button
                onClick={() => setViewTab("duplicates")}
                className={cn(
                  "text-game rounded-md px-3 py-1 text-xs transition",
                  viewTab === "duplicates"
                    ? "border-gold-deep bg-gold text-ink"
                    : "text-foreground hover:bg-background/50",
                )}
              >
                All Duplicates
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-game text-ink text-xs mr-1">Category:</span>
            <button
              onClick={() => setSelectedCat("all")}
              className={cn(
                "rounded-md border px-2.5 py-0.5 text-xs font-bold transition",
                selectedCat === "all"
                  ? "border-gold-deep bg-gold text-ink"
                  : "border-panel-edge bg-secondary text-foreground",
              )}
            >
              All Categories
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCat(c.id)}
                className={cn(
                  "rounded-md border px-2.5 py-0.5 text-xs font-bold transition",
                  selectedCat === c.id
                    ? "border-gold-deep bg-gold text-ink"
                    : "border-panel-edge bg-secondary text-foreground",
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* View Mode: Trade Suggestions */}
        {viewTab === "trades" && (
          <div className="mt-4 space-y-5">
            {/* 1-to-1 Balanced Trades Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-game text-ink text-base sm:text-lg flex items-center gap-2">
                  <span>⚡ 1-to-1 Direct Trades</span>
                  <span className="border-gold-deep bg-gold text-ink rounded-full border px-2 py-0.5 text-xs">
                    {filteredBalancedTrades.length}
                  </span>
                </h3>
              </div>

              {filteredBalancedTrades.length === 0 ? (
                <div className="bg-parchment/60 border-panel-edge rounded-xl border-2 p-6 text-center">
                  <p className="text-ink text-sm font-bold">No direct 1-to-1 trade matches found.</p>
                  <p className="text-ink/70 text-xs mt-1">
                    Try adjusting your account filters or adding duplicate card counts (quantity &gt; 1) on the Collection page.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {filteredBalancedTrades.map((bt, idx) => (
                    <div
                      key={idx}
                      className="border-panel-edge bg-panel/90 rounded-xl border-[3px] p-3 shadow-md space-y-2"
                    >
                      <div className="text-game text-ink text-xs border-b border-panel-edge/40 pb-1.5 flex justify-between items-center">
                        <span className="font-bold text-gold-deep">Win-Win Direct Swap</span>
                        <span className="text-ink/65 text-[10px]">Trade #{(idx + 1).toString()}</span>
                      </div>

                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                        {/* Account A */}
                        <div className="bg-parchment rounded-lg border-2 border-panel-edge p-2 text-center space-y-1">
                          <div className="text-game text-ink truncate text-xs">{bt.accountA.name}</div>
                          <div className="text-xs font-bold text-emerald-800">gives:</div>
                          <div
                            className={cn(
                              "rounded-md border px-1.5 py-1 text-xs font-bold truncate",
                              CATEGORY_COLORS[bt.cardA.category],
                            )}
                          >
                            {bt.cardA.name}
                          </div>
                        </div>

                        {/* Swap Icon */}
                        <div className="text-game text-gold-deep text-lg font-extrabold px-1">
                          ⇄
                        </div>

                        {/* Account B */}
                        <div className="bg-parchment rounded-lg border-2 border-panel-edge p-2 text-center space-y-1">
                          <div className="text-game text-ink truncate text-xs">{bt.accountB.name}</div>
                          <div className="text-xs font-bold text-emerald-800">gives:</div>
                          <div
                            className={cn(
                              "rounded-md border px-1.5 py-1 text-xs font-bold truncate",
                              CATEGORY_COLORS[bt.cardB.category],
                            )}
                          >
                            {bt.cardB.name}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => completeTrade(bt)}
                        className="text-game border-gold-deep bg-gold text-ink w-full rounded-lg border-2 px-3 py-1.5 text-xs hover:brightness-110 active:translate-y-0.5"
                      >
                        Done — apply this trade
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* One-way Surplus Transfers Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-game text-ink text-base sm:text-lg flex items-center gap-2">
                  <span>🎁 Available Surplus Transfers</span>
                  <span className="border-panel-edge bg-secondary text-foreground rounded-full border px-2 py-0.5 text-xs">
                    {filteredSurplusTransfers.length}
                  </span>
                </h3>
              </div>

              {filteredSurplusTransfers.length === 0 ? (
                <div className="bg-parchment/60 border-panel-edge rounded-xl border-2 p-4 text-center">
                  <p className="text-ink text-xs font-bold">No additional surplus transfers found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                  {filteredSurplusTransfers.map((st, idx) => (
                    <div
                      key={idx}
                      className="border-panel-edge bg-panel/70 rounded-lg border-2 p-2.5 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="text-game text-ink text-xs truncate">
                          <span className="font-bold">{st.fromAccount.name}</span> →{" "}
                          <span className="font-bold">{st.toAccount.name}</span>
                        </div>
                        <div
                          className={cn(
                            "inline-block rounded-md border px-2 py-0.5 text-xs font-bold truncate max-w-full",
                            CATEGORY_COLORS[st.card.category],
                          )}
                        >
                          {st.card.name}
                        </div>
                      </div>
                      <span className="text-game border-gold-deep bg-gold text-ink rounded-md border px-2 py-1 text-xs shrink-0 font-bold">
                        +{st.availableQty} spare
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* View Mode: All Duplicates Breakdown */}
        {viewTab === "duplicates" && (
          <div className="bg-parchment border-panel-edge mt-4 space-y-3 rounded-xl border-[3px] p-4">
            <h3 className="text-game text-ink text-base">Spare Duplicates per Account</h3>
            <p className="text-ink/70 text-xs font-bold">
              Showing cards with quantity &gt; 1 (available to trade or give away).
            </p>

            <div className="space-y-4">
              {accounts.map((acc) => {
                const dupes = CARDS.map((c) => ({
                  card: c,
                  qty: qtyOf(t.data, acc.account_id, c.card_id),
                })).filter(
                  (item) =>
                    item.qty > 1 &&
                    (selectedCat === "all" || item.card.category === selectedCat),
                );

                return (
                  <div key={acc.account_id} className="border-panel-edge/50 border-t pt-3 first:border-0 first:pt-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-game text-ink text-sm font-bold">{acc.name}</span>
                      <span className="text-ink text-xs font-bold">
                        {dupes.length} duplicate card type{dupes.length === 1 ? "" : "s"}
                      </span>
                    </div>

                    {dupes.length === 0 ? (
                      <p className="text-ink/60 text-xs italic">No duplicates for this account.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {dupes.map(({ card, qty }) => (
                          <div
                            key={card.card_id}
                            className={cn(
                              "flex items-center gap-1.5 rounded-lg border-2 px-2.5 py-1 text-xs font-bold",
                              CATEGORY_COLORS[card.category],
                            )}
                          >
                            <span>{card.name}</span>
                            <span className="border-gold-deep bg-gold text-ink rounded-md border px-1.5 text-[11px]">
                              x{qty} ({qty - 1} spare)
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </EventPanel>
    </main>
  );
}
