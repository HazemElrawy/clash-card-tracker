import { Link, useRouterState } from "@tanstack/react-router";
import { CATEGORIES, type CategoryId } from "@/lib/cards";
import type { AccountId, AppData } from "@/lib/store";
import { categoryProgress } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Collection" },
  { to: "/compare", label: "Compare" },
  { to: "/settings", label: "Settings" },
] as const;

export function TopNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex gap-2">
      {NAV.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className={cn(
            "text-game rounded-lg border-2 px-4 py-1.5 text-sm transition-transform active:translate-y-0.5",
            pathname === item.to
              ? "border-gold-deep bg-gold text-ink"
              : "border-panel-edge bg-secondary text-foreground hover:brightness-110",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function AccountBar({
  data,
  selected,
  onSelect,
  onAddAccount,
}: {
  data: AppData;
  selected: AccountId;
  onSelect: (id: AccountId) => void;
  onAddAccount?: () => void;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:flex-wrap sm:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {data.accounts.map((a) => (
          <button
            key={a.account_id}
            onClick={() => onSelect(a.account_id)}
            className={cn(
              "text-game max-w-[10rem] truncate rounded-lg border-2 px-3 py-1.5 text-sm transition-transform active:translate-y-0.5",
              selected === a.account_id
                ? "border-gold-deep bg-gold text-ink"
                : "border-panel-edge bg-secondary text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)] hover:brightness-110",
            )}
          >
            {a.name}
          </button>
        ))}
        {onAddAccount && (
          <button
            onClick={onAddAccount}
            title="Add new account"
            className="text-game rounded-lg border-2 border-dashed border-gold-deep bg-gold/30 px-3 py-1.5 text-sm text-foreground hover:bg-gold/50 transition-colors"
          >
            + Add
          </button>
        )}
      </div>
      <TopNav />
    </div>
  );
}

const CAT_BG: Record<CategoryId, string> = {
  elixir: "bg-elixir",
  dark: "bg-dark-elixir",
  builder: "bg-builder",
  super: "bg-super",
};

export function CategoryTabs({
  data,
  accountId,
  active,
  onChange,
}: {
  data: AppData;
  accountId: string;
  active?: CategoryId;
  onChange?: (id: CategoryId) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
      {CATEGORIES.map((cat) => {
        const { owned, total } = categoryProgress(data, accountId, cat.id);
        const pct = Math.round((owned / total) * 100);
        const isActive = active === cat.id;
        const body = (
          <>
            <div className="text-game truncate text-sm text-foreground sm:text-base">
              {cat.name}
            </div>
            <div className="border-panel-edge relative mt-1 h-5 overflow-hidden rounded-md border-2 bg-ink/40">
              <div
                className="bg-gold h-full transition-[width] duration-300"
                style={{ width: `${pct}%` }}
              />
              <span className="text-game absolute inset-0 grid place-items-center text-xs text-foreground">
                {owned}/{total}
              </span>
            </div>
          </>
        );
        const classes = cn(
          "rounded-xl border-[3px] px-3 pt-1.5 pb-2 text-center transition",
          CAT_BG[cat.id],
          isActive
            ? "border-gold scale-[1.02] brightness-110"
            : "border-panel-edge opacity-80 hover:opacity-100",
        );
        return onChange ? (
          <button key={cat.id} onClick={() => onChange(cat.id)} className={classes}>
            {body}
          </button>
        ) : (
          <div key={cat.id} className={classes}>
            {body}
          </div>
        );
      })}
    </div>
  );
}
