import { CARDS, type Card } from "./cards";
import { qtyOf, type AppAccount, type AppData } from "./store";

export type BalancedTrade = {
  accountA: AppAccount;
  accountB: AppAccount;
  cardA: Card; // Account A gives cardA to Account B
  cardB: Card; // Account B gives cardB to Account A
};

export type SurplusTransfer = {
  fromAccount: AppAccount;
  toAccount: AppAccount;
  card: Card;
  availableQty: number; // excess copies available (qty - 1)
};

export type AccountSummary = {
  account: AppAccount;
  ownedCount: number;
  missingCount: number;
  duplicateCount: number; // total excess cards (sum of qty - 1 for qty > 1)
};

export function getAccountSummaries(data: AppData): AccountSummary[] {
  return data.accounts.map((acc) => {
    let ownedCount = 0;
    let missingCount = 0;
    let duplicateCount = 0;

    for (const card of CARDS) {
      const q = qtyOf(data, acc.account_id, card.card_id);
      if (q > 0) {
        ownedCount++;
        if (q > 1) {
          duplicateCount += q - 1;
        }
      } else {
        missingCount++;
      }
    }

    return {
      account: acc,
      ownedCount,
      missingCount,
      duplicateCount,
    };
  });
}

export function computeTradeSuggestions(
  data: AppData,
  filterAccount1?: string,
  filterAccount2?: string,
) {
  const accounts = data.accounts;
  const balancedTrades: BalancedTrade[] = [];
  const surplusTransfers: SurplusTransfer[] = [];

  // Map of pairs already matched in balanced trades to avoid listing them as 1-way gifts
  const matchedGiftKeys = new Set<string>();

  // 1. Compute Balanced 1-to-1 Trades between every pair of accounts
  for (let i = 0; i < accounts.length; i++) {
    for (let j = i + 1; j < accounts.length; j++) {
      const accA = accounts[i]!;
      const accB = accounts[j]!;

      // Filter check if specific accounts are selected
      if (filterAccount1 && filterAccount1 !== "all") {
        if (accA.account_id !== filterAccount1 && accB.account_id !== filterAccount1) {
          continue;
        }
      }
      if (filterAccount2 && filterAccount2 !== "all") {
        if (accA.account_id !== filterAccount2 && accB.account_id !== filterAccount2) {
          continue;
        }
      }

      // Cards A has extra and B needs
      const aGivesToB = CARDS.filter(
        (c) => qtyOf(data, accA.account_id, c.card_id) > 1 && qtyOf(data, accB.account_id, c.card_id) === 0,
      );

      // Cards B has extra and A needs
      const bGivesToA = CARDS.filter(
        (c) => qtyOf(data, accB.account_id, c.card_id) > 1 && qtyOf(data, accA.account_id, c.card_id) === 0,
      );

      // Direct swaps must stay within the same rarity group (card category).
      for (const category of ["elixir", "dark", "builder", "super"] as const) {
        const aCards = aGivesToB.filter((card) => card.category === category);
        const bCards = bGivesToA.filter((card) => card.category === category);
        const pairCount = Math.min(aCards.length, bCards.length);

        for (let k = 0; k < pairCount; k++) {
          const cardA = aCards[k]!;
          const cardB = bCards[k]!;
          balancedTrades.push({
            accountA: accA,
            accountB: accB,
            cardA,
            cardB,
          });

          matchedGiftKeys.add(`${accA.account_id}->${accB.account_id}:${cardA.card_id}`);
          matchedGiftKeys.add(`${accB.account_id}->${accA.account_id}:${cardB.card_id}`);
        }
      }
    }
  }

  // 2. Compute Surplus Transfers (One-way transfers of remaining duplicates)
  for (let i = 0; i < accounts.length; i++) {
    for (let j = 0; j < accounts.length; j++) {
      if (i === j) continue;
      const fromAcc = accounts[i]!;
      const toAcc = accounts[j]!;

      if (filterAccount1 && filterAccount1 !== "all") {
        if (fromAcc.account_id !== filterAccount1 && toAcc.account_id !== filterAccount1) {
          continue;
        }
      }
      if (filterAccount2 && filterAccount2 !== "all") {
        if (fromAcc.account_id !== filterAccount2 && toAcc.account_id !== filterAccount2) {
          continue;
        }
      }

      for (const card of CARDS) {
        const fromQty = qtyOf(data, fromAcc.account_id, card.card_id);
        const toQty = qtyOf(data, toAcc.account_id, card.card_id);

        if (fromQty > 1 && toQty === 0) {
          const key = `${fromAcc.account_id}->${toAcc.account_id}:${card.card_id}`;
          if (!matchedGiftKeys.has(key)) {
            surplusTransfers.push({
              fromAccount: fromAcc,
              toAccount: toAcc,
              card,
              availableQty: fromQty - 1,
            });
          }
        }
      }
    }
  }

  return {
    balancedTrades,
    surplusTransfers,
  };
}
