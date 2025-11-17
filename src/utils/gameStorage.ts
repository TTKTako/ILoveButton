import { GameState, UpgradeState, SingleUpgrade, SingleUpgradeState } from '@/types/game';

const GAME_STATE_KEY = 'buttonClickerGameState';
const MAX_SAFE_NUMBER = 2000000000; // 2 billion to prevent overflow

export const safeAdd = (a: number, b: number): number => {
  const result = a + b;
  return Math.min(result, MAX_SAFE_NUMBER);
};

export const safeSubtract = (a: number, b: number): number => {
  return Math.max(0, a - b);
};

export const calculateUpgradePrice = (basePrice: number, count: number): number => {
  // Cookie Clicker formula: basePrice * (1.15 ^ count)
  const price = Math.floor(basePrice * Math.pow(1.15, count));
  return Math.min(price, MAX_SAFE_NUMBER);
};

export const calculateTotalCPS = (
  upgrades: UpgradeState,
  upgradeData: Array<{ id: string; base_cps: number }>,
  singleUpgrades?: SingleUpgradeState,
  singleUpgradeData?: SingleUpgrade[]
): number => {
  let totalCPS = 0;
  
  upgradeData.forEach((upgrade) => {
    const count = upgrades[upgrade.id] || 0;
    let baseCPS = upgrade.base_cps * count;
    
    // Apply single upgrade multipliers for this specific upgrade
    if (singleUpgrades && singleUpgradeData) {
      const multiplier = getUpgradeMultiplier(upgrade.id, singleUpgrades, singleUpgradeData);
      baseCPS *= multiplier;
    }
    
    totalCPS += baseCPS;
  });
  
  // Apply global multiplier
  if (singleUpgrades && singleUpgradeData) {
    const globalMultiplier = getUpgradeMultiplier('global', singleUpgrades, singleUpgradeData);
    totalCPS *= globalMultiplier;
  }
  
  return Math.min(totalCPS, MAX_SAFE_NUMBER);
};

export const getUpgradeMultiplier = (
  baseUpgradeId: string,
  singleUpgrades: SingleUpgradeState,
  singleUpgradeData: SingleUpgrade[]
): number => {
  let multiplier = 1;
  
  // Find all single upgrades that affect this base upgrade
  const relevantUpgrades = singleUpgradeData.filter(
    (su) => su.baseUpgradeId === baseUpgradeId
  );
  
  relevantUpgrades.forEach((singleUpgrade) => {
    const upgradeState = singleUpgrades[singleUpgrade.id] || {};
    
    // Apply all owned levels (they stack)
    singleUpgrade.levels.forEach((levelData) => {
      if (upgradeState[levelData.level]) {
        multiplier *= levelData.multiplier;
      }
    });
  });
  
  return multiplier;
};

export const getManualClickValue = (
  singleUpgrades: SingleUpgradeState,
  singleUpgradeData: SingleUpgrade[]
): number => {
  return getUpgradeMultiplier('manual', singleUpgrades, singleUpgradeData);
};

export const getDefaultGameState = (): GameState => ({
  score: 0,
  upgrades: {},
  purchasedSkins: ['default'],
  equippedSkin: 'default',
  singleUpgrades: {},
});

export const saveGameState = (state: GameState): void => {
  try {
    // Ensure all numbers are safe before saving
    const safeState: GameState = {
      score: Math.min(state.score, MAX_SAFE_NUMBER),
      upgrades: { ...state.upgrades },
      purchasedSkins: [...state.purchasedSkins],
      equippedSkin: state.equippedSkin,
      singleUpgrades: state.singleUpgrades || {},
    };
    
    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(safeState));
  } catch (error) {
    console.error('Failed to save game state:', error);
  }
};

export const loadGameState = (): GameState => {
  try {
    const saved = localStorage.getItem(GAME_STATE_KEY);
    if (!saved) {
      return getDefaultGameState();
    }
    
    const state = JSON.parse(saved) as GameState;
    
    // Ensure loaded state is valid and safe
    return {
      score: Math.min(state.score || 0, MAX_SAFE_NUMBER),
      upgrades: state.upgrades || {},
      purchasedSkins: state.purchasedSkins || ['default'],
      equippedSkin: state.equippedSkin || 'default',
      singleUpgrades: state.singleUpgrades || {},
    };
  } catch (error) {
    console.error('Failed to load game state:', error);
    return getDefaultGameState();
  }
};

export const resetGameState = (): void => {
  try {
    localStorage.removeItem(GAME_STATE_KEY);
  } catch (error) {
    console.error('Failed to reset game state:', error);
  }
};

export const formatNumber = (num: number): string => {
  // Handle very large numbers with scientific notation
  if (num >= 1e21) {
    return num.toExponential(2);
  }
  if (num >= 1e18) {
    return (num / 1e18).toFixed(2) + 'Qi'; // Quintillion
  }
  if (num >= 1e15) {
    return (num / 1e15).toFixed(2) + 'Qa'; // Quadrillion
  }
  if (num >= 1e12) {
    return (num / 1e12).toFixed(2) + 'T'; // Trillion
  }
  if (num >= 1e9) {
    return (num / 1e9).toFixed(2) + 'B'; // Billion
  }
  if (num >= 1e6) {
    return (num / 1e6).toFixed(2) + 'M'; // Million
  }
  if (num >= 1e3) {
    return (num / 1e3).toFixed(2) + 'K'; // Thousand
  }
  return num.toFixed(2);
};
