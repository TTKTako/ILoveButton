"use client";

import { useState } from 'react';
import { Upgrade, UpgradeState, SingleUpgrade, SingleUpgradeState } from '@/types/game';
import { calculateUpgradePrice, calculateBulkUpgradePrice, formatNumber, getUpgradeMultiplier } from '@/utils/gameStorage';

interface UpgradeShopProps {
  isOpen: boolean;
  onClose: () => void;
  upgrades: Upgrade[];
  upgradeState: UpgradeState;
  score: number;
  onPurchase: (upgradeId: string, quantity?: number) => void;
  totalCPS: number;
  singleUpgrades: SingleUpgradeState;
  singleUpgradeData: SingleUpgrade[];
}

export default function UpgradeShop({
  isOpen,
  onClose,
  upgrades,
  upgradeState,
  score,
  onPurchase,
  totalCPS,
  singleUpgrades,
  singleUpgradeData,
}: UpgradeShopProps) {
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const quantities = [1, 2, 5, 10, 50, 100];
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-1000 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] sm:max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-blue-500 text-white p-3 sm:p-4">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Upgrade Shop</h2>
              <p className="text-xs sm:text-sm opacity-90">
                Total Production: {formatNumber(totalCPS)} clicks/sec
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-blue-600 rounded px-2 sm:px-3 py-1 text-lg sm:text-xl font-bold"
            >
              ✕
            </button>
          </div>
          
          {/* Quantity Selector */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-semibold">Buy Amount:</span>
            {quantities.map((qty) => (
              <button
                key={qty}
                onClick={() => setSelectedQuantity(qty)}
                className={`px-3 py-1 rounded font-semibold text-sm transition-colors ${
                  selectedQuantity === qty
                    ? 'bg-white text-blue-600'
                    : 'bg-blue-400 text-white hover:bg-blue-300'
                }`}
              >
                {qty}
              </button>
            ))}
          </div>
        </div>

        {/* Upgrades List */}
        <div className="overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-3">
          {upgrades.map((upgrade) => {
            const count = upgradeState[upgrade.id] || 0;
            const price = selectedQuantity === 1 
              ? calculateUpgradePrice(upgrade.base_price, count)
              : calculateBulkUpgradePrice(upgrade.base_price, count, selectedQuantity);
            const canAfford = score >= price;
            const multiplier = getUpgradeMultiplier(upgrade.id, singleUpgrades, singleUpgradeData);
            const effectiveCPS = upgrade.base_cps * multiplier;
            const production = effectiveCPS * count;

            return (
              <div
                key={upgrade.id}
                className={`border rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  canAfford
                    ? 'bg-green-50 border-green-300 hover:bg-green-100'
                    : 'bg-gray-50 border-gray-300'
                } transition-colors`}
              >
                <div className="flex items-center gap-3 sm:gap-4 flex-1 w-full sm:w-auto">
                  <div className="text-2xl sm:text-3xl md:text-4xl flex-shrink-0">{upgrade.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base sm:text-lg text-black">
                      {upgrade.name}
                      {count > 0 && (
                        <span className="ml-2 text-xs sm:text-sm text-blue-600">
                          ({count})
                        </span>
                      )}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 break-words">
                      {upgrade.description}
                    </p>
                    <div className="flex flex-wrap gap-2 sm:gap-4 mt-1 text-xs text-gray-700">
                      <span>
                        Each: <strong>{formatNumber(effectiveCPS)}/s</strong>
                        {multiplier > 1 && (
                          <span className="ml-1 text-purple-600">(×{multiplier.toFixed(1)})</span>
                        )}
                      </span>
                      {count > 0 && (
                        <span>
                          Total: <strong>{formatNumber(production)}/s</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onPurchase(upgrade.id, selectedQuantity)}
                  disabled={!canAfford}
                  className={`px-4 sm:px-6 py-2 rounded font-semibold text-white transition-colors text-sm sm:text-base w-full sm:w-auto flex-shrink-0 ${
                    canAfford
                      ? 'bg-blue-500 hover:bg-blue-600 cursor-pointer'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  {selectedQuantity > 1 && <span className="text-xs block">Buy {selectedQuantity}x</span>}
                  {formatNumber(price)}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t p-3 sm:p-4 bg-gray-50">
          <p className="text-center text-xs sm:text-sm text-gray-600">
            Your Clicks: <strong className="text-black">{formatNumber(score)}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
