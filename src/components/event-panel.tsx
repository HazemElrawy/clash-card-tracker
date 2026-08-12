import type { ReactNode } from "react";

export function EventPanel({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="panel-frame mx-auto w-full max-w-6xl rounded-2xl">
      <div className="bg-ink/25 rounded-t-xl px-4 py-3 sm:px-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <h1 className="text-game truncate text-2xl text-foreground sm:text-3xl">{title}</h1>
          <span className="text-game border-panel-edge bg-secondary shrink-0 rounded-lg border-2 px-3 py-1 text-xs text-foreground sm:text-sm">
            Personal Tracker
          </span>
        </div>
        {subtitle && (
          <p className="text-game mt-1 text-sm text-foreground/85 sm:text-base">{subtitle}</p>
        )}
      </div>
      <div className="px-3 pt-3 pb-4 sm:px-5">{children}</div>
      {footer}
    </section>
  );
}

export function ProgressFooter({ owned, total }: { owned: number; total: number }) {
  const pct = Math.round((owned / total) * 100);
  const markers = [10, 20, 30, 40, 50, 60];
  return (
    <div className="bg-parchment border-panel-edge mx-3 mb-3 rounded-xl border-[3px] px-4 py-3 sm:mx-5">
      <div className="text-game text-ink text-center text-lg sm:text-xl">
        Cards Collected: {owned}/{total}
      </div>
      <div className="relative mt-3">
        <div className="border-gold-deep h-4 overflow-hidden rounded-full border-2 bg-ink/25">
          <div className="bg-gold h-full transition-[width]" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2 flex justify-between">
          {markers.map((m) => (
            <div key={m} className="flex flex-col items-center gap-1">
              <span
                className={`text-game grid h-7 w-7 place-items-center rounded-md border-2 text-xs ${
                  owned >= m
                    ? "border-gold-deep bg-gold text-ink"
                    : "border-panel-edge bg-secondary text-foreground"
                }`}
              >
                {owned >= m ? "✓" : "★"}
              </span>
              <span className="text-ink text-[10px] font-bold">{m}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
