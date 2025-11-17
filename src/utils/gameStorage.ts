import { GameState, UpgradeState } from '@/types/game';

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
  upgradeData: Array<{ id: string; base_cps: number }>
): number => {
  let totalCPS = 0;
  
  upgradeData.forEach((upgrade) => {
    const count = upgrades[upgrade.id] || 0;
    totalCPS += upgrade.base_cps * count;
  });
  
  return Math.min(totalCPS, MAX_SAFE_NUMBER);
};

export const getDefaultGameState = (): GameState => ({
  score: 0,
  upgrades: {},
  purchasedSkins: ['default'],
  equippedSkin: 'default',
});

export const saveGameState = (state: GameState): void => {
  try {
    // Ensure all numbers are safe before saving
    const safeState: GameState = {
      score: Math.min(state.score, MAX_SAFE_NUMBER),
      upgrades: { ...state.upgrades },
      purchasedSkins: [...state.purchasedSkins],
      equippedSkin: state.equippedSkin,
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
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(2) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K';
  }
  return Math.floor(num).toString();
};
