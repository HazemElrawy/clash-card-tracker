import { useEffect, useRef, useState } from "react";
import type { Card as CardType, CategoryId } from "@/lib/cards";
import { cn } from "@/lib/utils";

const CAT_RING: Record<CategoryId, string> = {
  elixir: "border-elixir",
  dark: "border-dark-elixir",
  builder: "border-builder",
  super: "border-super",
};

const CAT_ART: Record<CategoryId, string> = {
  elixir: "from-elixir/80 to-elixir/30",
  dark: "from-dark-elixir/85 to-dark-elixir/35",
  builder: "from-builder/80 to-builder/30",
  super: "from-super/80 to-super/30",
};

const initials = (name: string) =>
  name
    .replace(/[^A-Za-z. ]/g, "")
    .split(/[\s.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

export function CardTile({
  card,
  quantity,
  onChange,
}: {
  card: CardType;
  quantity: number;
  onChange: (q: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const owned = quantity > 0;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "tile-3d group block w-full overflow-hidden rounded-xl border-[4px] transition",
          CAT_RING[card.category],
          owned ? "hover:-translate-y-0.5" : "opacity-55 grayscale",
          open && "ring-gold -translate-y-0.5 ring-4",
        )}
      >
        <div
          className={cn(
            "relative grid aspect-[3/4] place-items-center bg-gradient-to-b",
            CAT_ART[card.category],
          )}
        >
          {card.image ? (
            <img
              src={card.image}
              alt={card.name}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-game text-3xl text-foreground sm:text-4xl">
              {initials(card.name)}
            </span>
          )}
          {owned && quantity > 1 && (
            <span className="text-game border-gold-deep bg-gold text-ink absolute bottom-1 left-1/2 -translate-x-1/2 rounded-md border-2 px-2 text-xs">
              x{quantity}
            </span>
          )}
        </div>
        <div className="bg-ink/85 px-1 py-1">
          <div className="text-game truncate text-[11px] text-foreground sm:text-xs">
            {card.name}
          </div>
          <div className="text-[10px] font-bold text-foreground/70">
            {owned ? `x${quantity}` : "Missing"}
          </div>
        </div>
      </button>

      {open && (
        <div className="border-panel-edge bg-parchment absolute top-full left-1/2 z-20 mt-1 flex w-max -translate-x-1/2 items-center gap-2 rounded-lg border-[3px] p-1.5 shadow-lg">
          <StepBtn label="−" onClick={() => onChange(Math.max(0, quantity - 1))} />
          <span className="text-game text-ink w-8 text-center text-lg">{quantity}</span>
          <StepBtn label="+" onClick={() => onChange(quantity + 1)} />
        </div>
      )}
    </div>
  );
}

function StepBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-game border-gold-deep bg-gold text-ink grid h-8 w-8 place-items-center rounded-md border-2 text-lg leading-none active:translate-y-0.5"
    >
      {label}
    </button>
  );
}
