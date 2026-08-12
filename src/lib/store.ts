import { useCallback, useEffect, useState } from "react";
import { CARDS, CATEGORIES, TOTAL_CARDS, type CategoryId } from "./cards";

export const ACCOUNT_IDS = ["a1", "a2", "a3", "a4", "a5"] as const;
export type AccountId = (typeof ACCOUNT_IDS)[number];

export type AppData = {
  version: 1;
  accounts: { account_id: AccountId; name: string }[];
  /** account_id -> card_id -> quantity (>0 means collected) */
  ownership: Record<string, Record<string, number>>;
};

const STORAGE_KEY = "coc-cards-tracker-v1";

export const emptyData = (): AppData => ({
  version: 1,
  accounts: ACCOUNT_IDS.map((id, i) => ({ account_id: id, name: `Account ${i + 1}` })),
  ownership: Object.fromEntries(ACCOUNT_IDS.map((id) => [id, {}])),
});

export function normalize(raw: unknown): AppData {
  const base = emptyData();
  if (!raw || typeof raw !== "object") return base;
  const d = raw as Partial<AppData>;
  if (Array.isArray(d.accounts)) {
    base.accounts = base.accounts.map((acc) => {
      const found = d.accounts!.find((a) => a?.account_id === acc.account_id);
      return found?.name ? { ...acc, name: String(found.name) } : acc;
    });
  }
  if (d.ownership && typeof d.ownership === "object") {
    for (const id of ACCOUNT_IDS) {
      const src = (d.ownership as Record<string, Record<string, number>>)[id] ?? {};
      const out: Record<string, number> = {};
      for (const card of CARDS) {
        const q = Number(src[card.card_id]);
        if (Number.isFinite(q) && q > 0) out[card.card_id] = Math.floor(q);
      }
      base.ownership[id] = out;
    }
  }
  return base;
}

function read(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalize(JSON.parse(raw)) : emptyData();
  } catch {
    return emptyData();
  }
}

function write(data: AppData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* quota / private mode */
  }
}

const SELECTED_KEY = "coc-cards-tracker-selected";

export function useTracker() {
  const [data, setData] = useState<AppData>(emptyData);
  const [selected, setSelectedState] = useState<AccountId>("a1");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setData(read());
    const sel = localStorage.getItem(SELECTED_KEY) as AccountId | null;
    if (sel && (ACCOUNT_IDS as readonly string[]).includes(sel)) setSelectedState(sel);
    setHydrated(true);
  }, []);

  const update = useCallback((fn: (d: AppData) => AppData) => {
    setData((prev) => {
      const next = fn(prev);
      write(next);
      return next;
    });
  }, []);

  const setSelected = useCallback((id: AccountId) => {
    setSelectedState(id);
    localStorage.setItem(SELECTED_KEY, id);
  }, []);

  const setQuantity = useCallback(
    (accountId: AccountId, cardId: string, qty: number) =>
      update((d) => {
        const acct = { ...(d.ownership[accountId] ?? {}) };
        const q = Math.max(0, Math.floor(qty));
        if (q === 0) delete acct[cardId];
        else acct[cardId] = q;
        return { ...d, ownership: { ...d.ownership, [accountId]: acct } };
      }),
    [update],
  );

  const renameAccount = useCallback(
    (accountId: AccountId, name: string) =>
      update((d) => ({
        ...d,
        accounts: d.accounts.map((a) =>
          a.account_id === accountId ? { ...a, name: name || a.name } : a,
        ),
      })),
    [update],
  );

  const resetAccount = useCallback(
    (accountId: AccountId) =>
      update((d) => ({ ...d, ownership: { ...d.ownership, [accountId]: {} } })),
    [update],
  );

  const resetAll = useCallback(() => update(() => emptyData()), [update]);

  const importData = useCallback(
    (raw: unknown) => update(() => normalize(raw)),
    [update],
  );

  return {
    data,
    hydrated,
    selected,
    setSelected,
    setQuantity,
    renameAccount,
    resetAccount,
    resetAll,
    importData,
  };
}

/* ---- derived helpers ---- */

export const qtyOf = (data: AppData, accountId: string, cardId: string) =>
  data.ownership[accountId]?.[cardId] ?? 0;

export const categoryProgress = (data: AppData, accountId: string, cat: CategoryId) => {
  const owned = CARDS.filter(
    (c) => c.category === cat && qtyOf(data, accountId, c.card_id) > 0,
  ).length;
  return { owned, total: CATEGORIES.find((c) => c.id === cat)!.total };
};

export const totalProgress = (data: AppData, accountId: string) => ({
  owned: CARDS.filter((c) => qtyOf(data, accountId, c.card_id) > 0).length,
  total: TOTAL_CARDS,
});
