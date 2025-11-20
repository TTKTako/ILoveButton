"use client";

import { SingleUpgrade, SingleUpgradeState, UpgradeState } from '@/types/game';
import { formatNumber } from '@/utils/gameStorage';

interface UpgradePopupProps {
  singleUpgrades: SingleUpgrade[];
  singleUpgradeState: SingleUpgradeState;
  baseUpgradeState: UpgradeState;
  score: number;
  onPurchase: (upgradeId: string, level: number) => void;
}

export default function UpgradePopup({
  singleUpgrades,
  singleUpgradeState,
  baseUpgradeState,
  score,
  onPurchase,
}: UpgradePopupProps) {
  // Check if all non-endgame upgrades are maxed
  const allUpgradesMaxed = singleUpgrades
    .filter(upgrade => upgrade.id !== 'endgame_upgrade')
    .every(upgrade => {
      const upgradeState = singleUpgradeState[upgrade.id] || {};
      // Check if all levels are owned
      return upgrade.levels.every(level => upgradeState[level.level] === true);
    });

  // Filter to only show upgrades for owned base upgrades or special upgrades
  const availableUpgrades = singleUpgrades.filter((upgrade) => {
    // Endgame upgrade only shows when all others are maxed
    if (upgrade.baseUpgradeId === 'endgame') {
      return allUpgradesMaxed;
    }
    // Special upgrades (manual, global) are always available
    if (upgrade.baseUpgradeId === 'manual' || upgrade.baseUpgradeId === 'global') {
      return true;
    }
    // Otherwise, must own at least 1 of the base upgrade
    return (baseUpgradeState[upgrade.baseUpgradeId] || 0) > 0;
  });

  // Get the next 3 purchasable upgrades
  const purchasableUpgrades: Array<{
    upgrade: SingleUpgrade;
    level: number;
    price: number;
  }> = [];

  for (const upgrade of availableUpgrades) {
    const upgradeState = singleUpgradeState[upgrade.id] || {};
    
    // Check if user has purchased at least one level of this upgrade
    const hasAnyLevel = upgrade.levels.some(levelData => upgradeState[levelData.level] === true);
    
    // Check if all levels are owned (upgrade is maxed)
    const allLevelsOwned = upgrade.levels.every(levelData => upgradeState[levelData.level] === true);
    
    // If upgrade is maxed, skip it
    if (allLevelsOwned) continue;
    
    // If user hasn't bought any level yet, skip it (unless it's level 1)
    if (!hasAnyLevel) {
      // Only show level 1 if requirements are met
      const levelData = upgrade.levels[0];
      if (levelData && levelData.level === 1) {
        const baseCount = baseUpgradeState[upgrade.baseUpgradeId] || 0;
        const meetsRequirement = upgrade.baseUpgradeId === 'manual' || 
                                upgrade.baseUpgradeId === 'global' || 
                                upgrade.baseUpgradeId === 'endgame' ||
                                baseCount >= levelData.unlockRequirement;
        
        if (meetsRequirement) {
          purchasableUpgrades.push({
            upgrade,
            level: levelData.level,
            price: levelData.price,
          });
        }
      }
      continue;
    }
    
    // Find the next level to purchase
    for (const levelData of upgrade.levels) {
      const isOwned = upgradeState[levelData.level] || false;
      
      if (!isOwned) {
        // Check unlock requirement
        const baseCount = baseUpgradeState[upgrade.baseUpgradeId] || 0;
        const meetsRequirement = upgrade.baseUpgradeId === 'manual' || 
                                upgrade.baseUpgradeId === 'global' || 
                                upgrade.baseUpgradeId === 'endgame' ||
                                baseCount >= levelData.unlockRequirement;
        
        if (meetsRequirement) {
          purchasableUpgrades.push({
            upgrade,
            level: levelData.level,
            price: levelData.price,
          });
        }
        break; // Only show the next level for each upgrade
      }
    }
  }

  if (purchasableUpgrades.length === 0) return null;

  return (
    <div className={`fixed top-2 sm:top-4 right-2 sm:right-4 z-40 flex flex-col gap-1.5 sm:gap-2 bg-white/5 backdrop-blur-sm rounded-lg p-1.5 sm:p-2 max-w-[calc(100vw-1rem)] sm:max-w-none ${
      purchasableUpgrades.length > 3 ? 'max-h-[300px] sm:max-h-[400px] overflow-y-auto' : ''
    }`}>
      {purchasableUpgrades.map(({ upgrade, level, price }) => {
        const canAfford = score >= price;
        const levelData = upgrade.levels.find(l => l.level === level);
        const isEndgame = upgrade.id === 'endgame_upgrade';
        
        return (
          <div
            key={`${upgrade.id}-${level}`}
            className={`bg-white border-2 rounded-lg shadow-lg p-2 sm:p-3 min-w-[240px] sm:min-w-[280px] transition-all ${
              isEndgame
                ? 'border-purple-500 bg-gradient-to-r from-purple-100 to-pink-100 animate-pulse'
                : canAfford 
                  ? 'border-green-400 hover:shadow-xl hover:scale-105 cursor-pointer' 
                  : 'border-gray-300 opacity-75'
            }`}
            onClick={() => canAfford && onPurchase(upgrade.id, level)}
          >
            <div className="flex items-start gap-2 sm:gap-3">
              <div className={`text-2xl sm:text-3xl flex-shrink-0 ${isEndgame ? 'animate-bounce' : ''}`}>{upgrade.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1 gap-2">
                  <h3 className={`font-bold text-xs sm:text-sm ${isEndgame ? 'text-purple-700' : 'text-black'} truncate`}>
                    {upgrade.name}
                    {!isEndgame && <span className="ml-1 text-[10px] sm:text-xs text-blue-600">Lv.{level}</span>}
                  </h3>
                  <div className={`text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded whitespace-nowrap flex-shrink-0 ${
                    isEndgame
                      ? 'bg-purple-200 text-purple-800'
                      : canAfford ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {formatNumber(price)}
                  </div>
                </div>
                <p className={`text-[10px] sm:text-xs mb-1 ${isEndgame ? 'text-purple-600 font-semibold' : 'text-gray-600'} line-clamp-2`}>
                  {upgrade.description}
                </p>
                {levelData && !isEndgame && (
                  <div className="text-[10px] sm:text-xs text-purple-600 font-semibold">
                    ×{levelData.multiplier} multiplier
                  </div>
                )}
                {isEndgame && (
                  <div className="text-[10px] sm:text-xs text-purple-700 font-bold mt-1">
                    ⚠️ THE FINAL UPGRADE ⚠️
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
