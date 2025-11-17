"use client";

import { Upgrade, UpgradeState, SingleUpgrade, SingleUpgradeState } from '@/types/game';
import { calculateUpgradePrice, formatNumber, getUpgradeMultiplier } from '@/utils/gameStorage';

interface UpgradeShopProps {
  isOpen: boolean;
  onClose: () => void;
  upgrades: Upgrade[];
  upgradeState: UpgradeState;
  score: number;
  onPurchase: (upgradeId: string) => void;
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-1000">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-blue-500 text-white p-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Upgrade Shop</h2>
            <p className="text-sm opacity-90">
              Total Production: {formatNumber(totalCPS)} clicks/sec
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-600 rounded px-3 py-1 text-xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Upgrades List */}
        <div className="overflow-y-auto p-4 space-y-3">
          {upgrades.map((upgrade) => {
            const count = upgradeState[upgrade.id] || 0;
            const price = calculateUpgradePrice(upgrade.base_price, count);
            const canAfford = score >= price;
            const multiplier = getUpgradeMultiplier(upgrade.id, singleUpgrades, singleUpgradeData);
            const effectiveCPS = upgrade.base_cps * multiplier;
            const production = effectiveCPS * count;

            return (
              <div
                key={upgrade.id}
                className={`border rounded-lg p-4 flex items-center justify-between ${
                  canAfford
                    ? 'bg-green-50 border-green-300 hover:bg-green-100'
                    : 'bg-gray-50 border-gray-300'
                } transition-colors`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="text-4xl">{upgrade.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-black">
                      {upgrade.name}
                      {count > 0 && (
                        <span className="ml-2 text-sm text-blue-600">
                          ({count})
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {upgrade.description}
                    </p>
                    <div className="flex gap-4 mt-1 text-xs text-gray-700">
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
                  onClick={() => onPurchase(upgrade.id)}
                  disabled={!canAfford}
                  className={`px-6 py-2 rounded font-semibold text-white transition-colors ${
                    canAfford
                      ? 'bg-blue-500 hover:bg-blue-600 cursor-pointer'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  {formatNumber(price)}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <p className="text-center text-sm text-gray-600">
            Your Clicks: <strong className="text-black">{formatNumber(score)}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
