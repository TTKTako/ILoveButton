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

export interface SingleUpgradeLevel {
  level: number;
  price: number;
  multiplier: number;
  unlockRequirement: number;
}

export interface SingleUpgrade {
  id: string;
  name: string;
  baseUpgradeId: string;
  description: string;
  icon: string;
  levels: SingleUpgradeLevel[];
}

export interface SingleUpgradeState {
  [upgradeId: string]: {
    [level: number]: boolean; // level -> owned or not
  };
}

export interface GameState {
  score: number;
  upgrades: UpgradeState;
  purchasedSkins: string[];
  equippedSkin: string;
  singleUpgrades?: SingleUpgradeState;
  isGalaxyMode?: boolean;
}
