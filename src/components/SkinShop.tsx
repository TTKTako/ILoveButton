"use client";

import { ButtonSkin } from '@/types/game';
import { formatNumber } from '@/utils/gameStorage';

interface SkinShopProps {
  isOpen: boolean;
  onClose: () => void;
  skins: ButtonSkin[];
  purchasedSkins: string[];
  equippedSkin: string;
  score: number;
  onPurchase: (skinId: string) => void;
  onEquip: (skinId: string) => void;
}

export default function SkinShop({
  isOpen,
  onClose,
  skins,
  purchasedSkins,
  equippedSkin,
  score,
  onPurchase,
  onEquip,
}: SkinShopProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center bg-black/50 justify-center z-1000 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] sm:max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-yellow-500 text-white p-3 sm:p-4 flex justify-between items-center">
          <h2 className="text-xl sm:text-2xl font-bold">Skin Shop</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-yellow-600 rounded px-2 sm:px-3 py-1 text-lg sm:text-xl font-bold"
          >
            X
          </button>
        </div>

        {/* Skins Grid */}
        <div className="overflow-y-auto p-2 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {skins.map((skin) => {
            const isPurchased = purchasedSkins.includes(skin.id);
            const isEquipped = equippedSkin === skin.value;
            const canAfford = score >= skin.price;

            return (
              <div
                key={skin.id}
                className={`border rounded-lg p-3 sm:p-4 flex flex-col items-center ${
                  isEquipped
                    ? 'bg-blue-100 border-blue-500 border-2'
                    : isPurchased
                    ? 'bg-green-50 border-green-300'
                    : canAfford
                    ? 'bg-yellow-50 border-yellow-300'
                    : 'bg-gray-50 border-gray-300'
                }`}
              >
                {/* Skin Preview */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 mb-2 sm:mb-3 relative bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                  <img
                    src={`/button/${skin.value}/unpress.png`}
                    alt={skin.name}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/button/default/unpress.png';
                    }}
                  />
                </div>

                {/* Skin Info */}
                <h3 className="font-bold text-center text-black mb-1 text-sm sm:text-base">
                  {skin.name}
                </h3>
                
                {isEquipped && (
                  <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded mb-2">
                    Equipped
                  </span>
                )}

                {/* Action Button */}
                {!isPurchased ? (
                  <button
                    onClick={() => onPurchase(skin.id)}
                    disabled={!canAfford}
                    className={`w-full px-3 sm:px-4 py-1.5 sm:py-2 rounded font-semibold text-white transition-colors text-sm sm:text-base ${
                      canAfford
                        ? 'bg-yellow-500 hover:bg-yellow-600 cursor-pointer'
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {skin.price === 0 ? 'Free' : formatNumber(skin.price)}
                  </button>
                ) : !isEquipped ? (
                  <button
                    onClick={() => onEquip(skin.id)}
                    className="w-full px-3 sm:px-4 py-1.5 sm:py-2 rounded font-semibold bg-blue-500 hover:bg-blue-600 text-white transition-colors cursor-pointer text-sm sm:text-base"
                  >
                    Equip
                  </button>
                ) : (
                  <div className="w-full px-3 sm:px-4 py-1.5 sm:py-2 rounded font-semibold bg-gray-300 text-gray-600 text-center text-sm sm:text-base">
                    Equipped
                  </div>
                )}
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
