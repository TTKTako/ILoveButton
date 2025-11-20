import { GameState, UpgradeState, SingleUpgrade, SingleUpgradeState } from '@/types/game';
import Decimal from 'break_infinity.js';

const GAME_STATE_KEY = 'buttonClickerGameState';

// Helper to convert to Decimal
export const D = (value: number | string | Decimal): Decimal => {
  return new Decimal(value);
};

export const safeAdd = (a: number, b: number): number => {
  const result = D(a).add(b);
  return result.toNumber();
};

export const safeSubtract = (a: number, b: number): number => {
  const result = D(a).sub(b);
  return Math.max(0, result.toNumber());
};

export const calculateUpgradePrice = (basePrice: number, count: number): number => {
  // Cookie Clicker formula: basePrice * (1.15 ^ count)
  const price = D(basePrice).times(D(1.15).pow(count));
  return price.floor().toNumber();
};

// Calculate the total cost of buying N upgrades
// Uses geometric series sum: basePrice * (1.15^count + 1.15^(count+1) + ... + 1.15^(count+n-1))
// Formula: basePrice * 1.15^count * (1.15^n - 1) / (1.15 - 1)
export const calculateBulkUpgradePrice = (basePrice: number, currentCount: number, amount: number): number => {
  if (amount <= 0) return 0;
  
  const multiplier = D(1.15);
  const basePriceDecimal = D(basePrice);
  const currentCountDecimal = D(currentCount);
  const amountDecimal = D(amount);
  
  // Calculate: basePrice * 1.15^currentCount * (1.15^amount - 1) / (1.15 - 1)
  const totalCost = basePriceDecimal
    .times(multiplier.pow(currentCountDecimal))
    .times(multiplier.pow(amountDecimal).sub(1))
    .div(multiplier.sub(1));
  
  return totalCost.floor().toNumber();
};

export const calculateTotalCPS = (
  upgrades: UpgradeState,
  upgradeData: Array<{ id: string; base_cps: number }>,
  singleUpgrades?: SingleUpgradeState,
  singleUpgradeData?: SingleUpgrade[]
): number => {
  let totalCPS = D(0);
  
  upgradeData.forEach((upgrade) => {
    const count = upgrades[upgrade.id] || 0;
    let baseCPS = D(upgrade.base_cps).times(count);
    
    // Apply single upgrade multipliers for this specific upgrade
    if (singleUpgrades && singleUpgradeData) {
      const multiplier = getUpgradeMultiplier(upgrade.id, singleUpgrades, singleUpgradeData);
      baseCPS = baseCPS.times(multiplier);
    }
    
    totalCPS = totalCPS.add(baseCPS);
  });
  
  // Apply global multiplier
  if (singleUpgrades && singleUpgradeData) {
    const globalMultiplier = getUpgradeMultiplier('global', singleUpgrades, singleUpgradeData);
    totalCPS = totalCPS.times(globalMultiplier);
  }
  
  return totalCPS.toNumber();
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
    // Numbers are stored as-is, break_infinity handles large numbers
    const safeState: GameState = {
      score: state.score,
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
    
    // Load state as-is
    return {
      score: state.score || 0,
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
  const decimal = D(num);
  
  // Handle very large numbers with better formatting
  if (decimal.gte(1e308)) {
    return decimal.toExponential(2);
  }
  if (decimal.gte(1e33)) {
    return decimal.toExponential(2);
  }
  if (decimal.gte(1e30)) {
    return decimal.div(1e30).toFixed(2) + ' No'; // Nonillion
  }
  if (decimal.gte(1e27)) {
    return decimal.div(1e27).toFixed(2) + ' Oc'; // Octillion
  }
  if (decimal.gte(1e24)) {
    return decimal.div(1e24).toFixed(2) + ' Sp'; // Septillion
  }
  if (decimal.gte(1e21)) {
    return decimal.div(1e21).toFixed(2) + ' Sx'; // Sextillion
  }
  if (decimal.gte(1e18)) {
    return decimal.div(1e18).toFixed(2) + ' Qi'; // Quintillion
  }
  if (decimal.gte(1e15)) {
    return decimal.div(1e15).toFixed(2) + ' Qa'; // Quadrillion
  }
  if (decimal.gte(1e12)) {
    return decimal.div(1e12).toFixed(2) + ' T'; // Trillion
  }
  if (decimal.gte(1e9)) {
    return decimal.div(1e9).toFixed(2) + ' B'; // Billion
  }
  if (decimal.gte(1e6)) {
    return decimal.div(1e6).toFixed(2) + ' M'; // Million
  }
  if (decimal.gte(1e3)) {
    return decimal.div(1e3).toFixed(2) + ' K'; // Thousand
  }
  return decimal.toFixed(2);
};
