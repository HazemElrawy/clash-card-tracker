// Card catalog for the Clash of Cards event.
// Stable IDs — safe for future screenshot recognition (V2) and cloud sync (V3).
// `image` is optional: fill it in later without touching any other code.

export type CategoryId = "elixir" | "dark" | "builder" | "super";

export type Category = {
  id: CategoryId;
  name: string;
  total: number;
};

export type Card = {
  card_id: string;
  name: string;
  category: CategoryId;
  image?: string;
};

export const CATEGORIES: Category[] = [
  { id: "elixir", name: "Elixir Cards", total: 19 },
  { id: "dark", name: "Dark Elixir Cards", total: 13 },
  { id: "builder", name: "Builder Base Cards", total: 11 },
  { id: "super", name: "Super Troop Cards", total: 17 },
];

const mk = (category: CategoryId, names: string[]): Card[] =>
  names.map((name) => ({
    card_id: `${category}_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`,
    name,
    category,
  }));

export const CARDS: Card[] = [
  ...mk("elixir", [
    "Barbarian",
    "Archer",
    "Giant",
    "Goblin",
    "Wall Breaker",
    "Balloon",
    "Wizard",
    "Healer",
    "Dragon",
    "P.E.K.K.A",
    "Baby Dragon",
    "Miner",
    "Electro Dragon",
    "Yeti",
    "Dragon Rider",
    "Electro Titan",
    "Root Rider",
    "Thrower",
    "Meteor Golem",
  ]),
  ...mk("dark", [
    "Minion",
    "Hog Rider",
    "Valkyrie",
    "Golem",
    "Witch",
    "Lava Hound",
    "Bowler",
    "Ice Golem",
    "Headhunter",
    "Apprentice Warden",
    "Druid",
    "Furnace",
    "Ruin Witch",
  ]),
  ...mk("builder", [
    "Raged Barbarian",
    "Sneaky Archer",
    "Boxer Giant",
    "Beta Minion",
    "Bomber",
    "Baby Dragon (BB)",
    "Cannon Cart",
    "Night Witch",
    "Drop Ship",
    "Power P.E.K.K.A",
    "Hog Glider",
  ]),
  ...mk("super", [
    "Super Barbarian",
    "Super Archer",
    "Super Giant",
    "Sneaky Goblin",
    "Super Wall Breaker",
    "Rocket Balloon",
    "Super Wizard",
    "Super Dragon",
    "Inferno Dragon",
    "Super Miner",
    "Super Minion",
    "Super Valkyrie",
    "Super Witch",
    "Ice Hound",
    "Super Bowler",
    "Super Hog Rider",
    "Super Yeti",
  ]),
];

export const TOTAL_CARDS = CARDS.length; // 60

export const cardsByCategory = (id: CategoryId) =>
  CARDS.filter((c) => c.category === id);
