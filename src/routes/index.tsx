import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AccountBar, CategoryTabs } from "@/components/event-chrome";
import { CardTile } from "@/components/card-tile";
import { EventPanel, ProgressFooter } from "@/components/event-panel";
import { ScreenshotImport } from "@/components/screenshot-import";
import { CATEGORIES, cardsByCategory, type CategoryId } from "@/lib/cards";
import { qtyOf, totalProgress, useTracker } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Clash of Cards Tracker — Collection" },
      {
        name: "description",
        content:
          "Track your Clash of Cards event collection across 5 Clash of Clans accounts: owned cards, duplicates and progress.",
      },
      { property: "og:title", content: "Clash of Cards Tracker — Collection" },
      {
        property: "og:description",
        content: "Track event cards and duplicates across 5 Clash of Clans accounts.",
      },
    ],
  }),
  component: CollectionPage,
});

function CollectionPage() {
  const t = useTracker();
  const [cat, setCat] = useState<CategoryId>("elixir");
  const account = t.data.accounts.find((a) => a.account_id === t.selected)!;
  const total = totalProgress(t.data, t.selected);

  return (
    <main className="min-h-screen px-3 py-5 sm:px-6">
      <div className="mx-auto mb-4 w-full max-w-6xl">
        <AccountBar data={t.data} selected={t.selected} onSelect={t.setSelected} />
      </div>

      <EventPanel
        title="Clash of Cards"
        subtitle={`Collecting as ${account.name} — ${CATEGORIES.find((c) => c.id === cat)!.name}`}
        footer={<ProgressFooter owned={total.owned} total={total.total} />}
      >
        <CategoryTabs
          data={t.data}
          accountId={t.selected}
          active={cat}
          onChange={setCat}
        />

        <div className="bg-parchment border-panel-edge mt-3 rounded-xl border-[3px] p-3">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-6">
            {cardsByCategory(cat).map((card) => (
              <CardTile
                key={card.card_id}
                card={card}
                quantity={qtyOf(t.data, t.selected, card.card_id)}
                onChange={(q) => t.setQuantity(t.selected, card.card_id, q)}
              />
            ))}
          </div>
        </div>

        <ScreenshotImport
          data={t.data}
          onApply={(accountId, cards) =>
            cards.forEach((c) => t.setQuantity(accountId, c.card_id, c.quantity))
          }
        />
      </EventPanel>
    </main>
  );
}
