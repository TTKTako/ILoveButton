export interface Upgrade {
  id: string;
  name: string;
  description: string;
  base_price: number;
  base_cps: number;
  icon: string;
}

export interface ButtonSkin {
  id: string;
  name: string;
  value: string;
  price: number;
}

export interface UpgradeState {
  [key: string]: number; // upgrade id -> count
}

export interface GameState {
  score: number;
  upgrades: UpgradeState;
  purchasedSkins: string[];
  equippedSkin: string;
}
