import { useCallback, useEffect, useState } from "react";
import { CARDS, CATEGORIES, TOTAL_CARDS, type CategoryId } from "./cards";

export const DEFAULT_ACCOUNT_IDS = ["a1", "a2", "a3", "a4", "a5"] as const;
export type AccountId = string;

export type AppAccount = {
  account_id: AccountId;
  name: string;
};

export type AppData = {
  version: 1;
  accounts: AppAccount[];
  /** account_id -> card_id -> quantity (>0 means collected) */
  ownership: Record<string, Record<string, number>>;
};

const STORAGE_KEY = "coc-cards-tracker-v1";

export const emptyData = (): AppData => ({
  version: 1,
  accounts: DEFAULT_ACCOUNT_IDS.map((id, i) => ({ account_id: id, name: `Account ${i + 1}` })),
  ownership: Object.fromEntries(DEFAULT_ACCOUNT_IDS.map((id) => [id, {}])),
});

export function normalize(raw: unknown): AppData {
  const base = emptyData();
  if (!raw || typeof raw !== "object") return base;
  const d = raw as Partial<AppData>;

  if (Array.isArray(d.accounts) && d.accounts.length > 0) {
    const loadedAccounts: AppAccount[] = d.accounts
      .filter((a): a is { account_id: string; name: string } => Boolean(a && typeof a.account_id === "string"))
      .map((a) => ({
        account_id: String(a.account_id),
        name: String(a.name || a.account_id),
      }));

    if (loadedAccounts.length > 0) {
      base.accounts = loadedAccounts;
    }
  }

  if (d.ownership && typeof d.ownership === "object") {
    const rawOwnership = d.ownership as Record<string, Record<string, number>>;
    const normOwnership: Record<string, Record<string, number>> = {};

    for (const acc of base.accounts) {
      const src = rawOwnership[acc.account_id] ?? {};
      const out: Record<string, number> = {};
      for (const card of CARDS) {
        const q = Number(src[card.card_id]);
        if (Number.isFinite(q) && q > 0) out[card.card_id] = Math.floor(q);
      }
      normOwnership[acc.account_id] = out;
    }

    base.ownership = normOwnership;
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
    const loaded = read();
    setData(loaded);
    const sel = localStorage.getItem(SELECTED_KEY);
    if (sel && loaded.accounts.some((a) => a.account_id === sel)) {
      setSelectedState(sel);
    } else if (loaded.accounts.length > 0) {
      setSelectedState(loaded.accounts[0]!.account_id);
    }
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

  const addAccount = useCallback(
    (name?: string) => {
      let newId = "";
      update((d) => {
        const nextIdx = d.accounts.length + 1;
        newId = `a_${Date.now()}`;
        const newName = name?.trim() || `Account ${nextIdx}`;
        return {
          ...d,
          accounts: [...d.accounts, { account_id: newId, name: newName }],
          ownership: { ...d.ownership, [newId]: {} },
        };
      });
      if (newId) {
        setSelected(newId);
      }
    },
    [update, setSelected],
  );

  const deleteAccount = useCallback(
    (accountId: AccountId) => {
      update((d) => {
        if (d.accounts.length <= 1) {
          alert("You must keep at least one account.");
          return d;
        }
        const nextAccounts = d.accounts.filter((a) => a.account_id !== accountId);
        const nextOwnership = { ...d.ownership };
        delete nextOwnership[accountId];
        return {
          ...d,
          accounts: nextAccounts,
          ownership: nextOwnership,
        };
      });
      setSelectedState((prevSelected) => {
        if (prevSelected === accountId) {
          const current = read();
          const fallback = current.accounts[0]?.account_id || "a1";
          localStorage.setItem(SELECTED_KEY, fallback);
          return fallback;
        }
        return prevSelected;
      });
    },
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
    addAccount,
    deleteAccount,
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
