"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import UpgradeShop from "@/components/UpgradeShop";
import SkinShop from "@/components/SkinShop";
import { Upgrade, ButtonSkin, GameState, UpgradeState } from "@/types/game";
import {
  loadGameState,
  saveGameState,
  resetGameState,
  calculateUpgradePrice,
  calculateTotalCPS,
  safeAdd,
  safeSubtract,
  formatNumber,
} from "@/utils/gameStorage";

export default function Home() {
  const [score, setScore] = useState(0);
  const [isPressed, setIsPressed] = useState(false);
  const [clicksPerSec, setClicksPerSec] = useState(0);
  const [buttonSkin, setButtonSkin] = useState("default");
  const [upgrades, setUpgrades] = useState<UpgradeState>({});
  const [purchasedSkins, setPurchasedSkins] = useState<string[]>(["default"]);
  
  const [upgradeData, setUpgradeData] = useState<Upgrade[]>([]);
  const [skinData, setSkinData] = useState<ButtonSkin[]>([]);
  
  const [isUpgradeShopOpen, setIsUpgradeShopOpen] = useState(false);
  const [isSkinShopOpen, setIsSkinShopOpen] = useState(false);
  const [adPosition, setAdPosition] = useState<{ x: number; y: number } | null>(null);
  const [fallingClicks, setFallingClicks] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [floatingMemes, setFloatingMemes] = useState<Array<{ 
    id: number; 
    upgradeId: string; 
    direction: 'left-to-right' | 'right-to-left' | 'top-to-bottom' | 'bottom-to-top';
    startPos: number;
  }>>([]);
  
  const clickTimestamps = useRef<number[]>([]);
  const hasLoadedData = useRef(false);
  const fallingClickIdRef = useRef(0);
  const memeIdRef = useRef(0);

  // Load game data from JSON files
  useEffect(() => {
    const loadData = async () => {
      try {
        const [upgradeRes, skinRes] = await Promise.all([
          fetch("/data/upgrade.json"),
          fetch("/data/buttonSkin.json"),
        ]);
        
        const upgradeJson = await upgradeRes.json();
        const skinJson = await skinRes.json();
        
        setUpgradeData(upgradeJson.upgrades || []);
        setSkinData(skinJson.ButtonSkins || []);
      } catch (error) {
        console.error("Failed to load game data:", error);
      }
    };
    
    loadData();
  }, []);

  // Load game state from localStorage on mount
  useEffect(() => {
    if (hasLoadedData.current) return;
    hasLoadedData.current = true;
    
    const gameState = loadGameState();
    setScore(gameState.score);
    setUpgrades(gameState.upgrades);
    setPurchasedSkins(gameState.purchasedSkins);
    setButtonSkin(gameState.equippedSkin);
  }, []);

  // Save game state whenever it changes
  useEffect(() => {
    if (!hasLoadedData.current) return;
    
    const gameState: GameState = {
      score,
      upgrades,
      purchasedSkins,
      equippedSkin: buttonSkin,
    };
    
    saveGameState(gameState);
  }, [score, upgrades, purchasedSkins, buttonSkin]);

  // Auto-click from upgrades (CPS)
  useEffect(() => {
    if (upgradeData.length === 0) return; // Wait for upgrade data to load
    
    const totalCPS = calculateTotalCPS(upgrades, upgradeData);
    
    if (totalCPS > 0) {
      const interval = setInterval(() => {
        setScore((prevScore) => safeAdd(prevScore, totalCPS / 10)); // Update 10 times per second
      }, 100);
      
      return () => clearInterval(interval);
    }
  }, [upgrades, upgradeData]);

  // Calculate manual clicks per second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const recentClicks = clickTimestamps.current.filter(
        timestamp => now - timestamp <= 1000
      );
      clickTimestamps.current = recentClicks;
      setClicksPerSec(recentClicks.length);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Random ad appearance
  useEffect(() => {
    const showRandomAd = () => {
      // Random interval between 30-90 seconds
      const randomDelay = Math.random() * 60000 + 30000;
      
      setTimeout(() => {
        // Random position on screen (avoiding edges)
        const x = Math.random() * (window.innerWidth - 150) + 50;
        const y = Math.random() * (window.innerHeight - 150) + 50;
        setAdPosition({ x, y });
        showRandomAd(); // Schedule next ad
      }, randomDelay);
    };

    showRandomAd();
  }, []);

  // Spawn floating meme images for owned upgrades
  useEffect(() => {
    const intervals: NodeJS.Timeout[] = [];
    
    const startMemeChaos = () => {
      const ownedUpgrades = upgradeData.filter((upgrade) => (upgrades[upgrade.id] || 0) >= 1);
      
      // Clear previous intervals
      intervals.forEach(clearInterval);
      intervals.length = 0;
      
      if (ownedUpgrades.length > 0) {
        ownedUpgrades.forEach((upgrade) => {
          const upgradeCount = upgrades[upgrade.id] || 0;
          const maxOnScreen = Math.min(upgradeCount, 10);
          
          // Create interval for each upgrade type
          const interval = setInterval(() => {
            // Count current memes of this upgrade type on screen
            setFloatingMemes((prev) => {
              const currentCount = prev.filter((meme) => meme.upgradeId === upgrade.id).length;
              
              if (currentCount >= maxOnScreen) return prev; // Don't spawn if at max
              
              // Spawn only 1 meme at a time for spread effect
              const directions: Array<'left-to-right' | 'right-to-left' | 'top-to-bottom' | 'bottom-to-top'> = ['left-to-right', 'right-to-left', 'top-to-bottom', 'bottom-to-top'];
              const direction = directions[Math.floor(Math.random() * directions.length)];
              
              // Random starting position
              const startPos = Math.random() * ((direction === 'left-to-right' || direction === 'right-to-left') ? window.innerHeight : window.innerWidth);
              
              const memeId = memeIdRef.current++;
              
              setTimeout(() => {
                setFloatingMemes((current) => [...current, {
                  id: memeId,
                  upgradeId: upgrade.id,
                  direction,
                  startPos,
                }]);
                
                // Remove after animation completes (8 seconds)
                setTimeout(() => {
                  setFloatingMemes((current) => current.filter((meme) => meme.id !== memeId));
                }, 8000);
              }, Math.random() * 500); // Random delay 0-500ms for more spread
              
              return prev;
            });
          }, Math.random() * 800 + 400); // Random interval 400-1200ms per upgrade type
          
          intervals.push(interval);
        });
      }
    };

    if (upgradeData.length > 0) {
      startMemeChaos();
    }
    
    return () => {
      intervals.forEach(clearInterval);
    };
  }, [upgrades, upgradeData]);

  const handleClick = () => {
    setScore((prevScore) => safeAdd(prevScore, 1));
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);
    
    // Play click sound
    const audio = new Audio(`/button/${buttonSkin}/click.wav`);
    audio.volume = 0.3;
    audio.play().catch(err => console.log('Audio play failed:', err));
    
    const now = Date.now();
    clickTimestamps.current.push(now);
    
    // Remove clicks older than 1 second
    clickTimestamps.current = clickTimestamps.current.filter(
      timestamp => now - timestamp <= 1000
    );
  };

  const handlePurchaseUpgrade = (upgradeId: string) => {
    const upgrade = upgradeData.find((u) => u.id === upgradeId);
    if (!upgrade) return;
    
    const currentCount = upgrades[upgradeId] || 0;
    const price = calculateUpgradePrice(upgrade.base_price, currentCount);
    
    if (score >= price) {
      setScore((prevScore) => safeSubtract(prevScore, price));
      setUpgrades((prev) => ({
        ...prev,
        [upgradeId]: currentCount + 1,
      }));
    }
  };

  const handlePurchaseSkin = (skinId: string) => {
    const skin = skinData.find((s) => s.id === skinId);
    if (!skin) return;
    
    if (score >= skin.price && !purchasedSkins.includes(skinId)) {
      setScore((prevScore) => safeSubtract(prevScore, skin.price));
      setPurchasedSkins((prev) => [...prev, skinId]);
      
      // Auto-equip after purchase
      setButtonSkin(skin.value);
    }
  };

  const handleEquipSkin = (skinId: string) => {
    const skin = skinData.find((s) => s.id === skinId);
    if (!skin) return;
    
    if (purchasedSkins.includes(skinId)) {
      setButtonSkin(skin.value);
    }
  };

  const handleAdClick = () => {
    if (!adPosition) return;
    
    const totalCPS = calculateTotalCPS(upgrades, upgradeData);
    const reward = totalCPS > 0 ? totalCPS * 15 : 10;
    setScore((prevScore) => safeAdd(prevScore, reward));
    
    // Create falling click effect
    const clickId = fallingClickIdRef.current++;
    setFallingClicks((prev) => [...prev, { id: clickId, x: adPosition.x, y: adPosition.y }]);
    
    // Remove falling click after animation
    setTimeout(() => {
      setFallingClicks((prev) => prev.filter((click) => click.id !== clickId));
    }, 2000);
    
    setAdPosition(null);
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all progress? This cannot be undone!")) {
      setScore(0);
      setUpgrades({});
      setPurchasedSkins(["default"]);
      setButtonSkin("default");
      clickTimestamps.current = [];
      setClicksPerSec(0);
      resetGameState();
    }
  };

  const totalCPS = calculateTotalCPS(upgrades, upgradeData);

  // Check if any upgrade is affordable
  const canAffordAnyUpgrade = upgradeData.some((upgrade) => {
    const currentCount = upgrades[upgrade.id] || 0;
    const price = calculateUpgradePrice(upgrade.base_price, currentCount);
    return score >= price;
  });

  // Check if any skin is affordable
  const canAffordAnySkin = skinData.some((skin) => {
    return !purchasedSkins.includes(skin.id) && score >= skin.price;
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-white flex-col">
      <div className="mb-4 text-4xl font-bold text-black absolute top-4 flex flex-col gap-2 align-center justify-center text-center w-max z-50">
        <h1 className="font-bold text-black text-3xl">{formatNumber(score)} Click(s)</h1>
        <h1 className="font-semibold text-black text-lg">
          Total: {formatNumber(totalCPS + clicksPerSec)} clicks/sec
        </h1>
        <div className="text-sm text-gray-600">
          Manual: {clicksPerSec.toFixed(2)}/s | Auto: {formatNumber(totalCPS)}/s
        </div>
        <div className="flex flex-row gap-2 text-lg justify-center">
          <button
            onClick={() => setIsUpgradeShopOpen(true)}
            className="shadow-lg px-4 py-1 border rounded text-black text-center bg-blue-100 hover:bg-blue-200 cursor-pointer relative"
          >
            Upgrade
            {canAffordAnyUpgrade && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </button>
          <button
            onClick={() => setIsSkinShopOpen(true)}
            className="shadow-lg px-4 py-1 border rounded text-black text-center bg-yellow-100 hover:bg-yellow-200 cursor-pointer relative"
          >
            Skin
            {canAffordAnySkin && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </button>
        </div>
      </div>
      
      <div className="text-center h-2/3 flex flex-col justify-center z-1000">
        <Image
          src={`/button/${buttonSkin}/${isPressed ? 'press' : 'unpress'}.png`}
          alt="Logo"
          width={200}
          height={200}
          className="mx-auto cursor-pointer"
          onClick={handleClick}
        />
      </div>
      
      <p
        className="absolute bottom-3 right-4 text-sm text-gray-500 hover:underline hover:text-red-500 cursor-pointer"
        onClick={handleReset}
      >
        reset data...
      </p>

      {/* Upgrade Shop Modal */}
      <UpgradeShop
        isOpen={isUpgradeShopOpen}
        onClose={() => setIsUpgradeShopOpen(false)}
        upgrades={upgradeData}
        upgradeState={upgrades}
        score={score}
        onPurchase={handlePurchaseUpgrade}
        totalCPS={totalCPS}
      />

      {/* Skin Shop Modal */}
      <SkinShop
        isOpen={isSkinShopOpen}
        onClose={() => setIsSkinShopOpen(false)}
        skins={skinData}
        purchasedSkins={purchasedSkins}
        equippedSkin={buttonSkin}
        score={score}
        onPurchase={handlePurchaseSkin}
        onEquip={handleEquipSkin}
      />

      {/* Random Ad Button */}
      {adPosition && (
        <div
          style={{
            position: 'fixed',
            left: `${adPosition.x}px`,
            top: `${adPosition.y}px`,
            zIndex: 1000,
          }}
          className="cursor-pointer animate-bounce z-999"
          onClick={handleAdClick}
        >
          <Image
            src="/ads.png"
            alt="Special Bonus"
            width={100}
            height={100}
            className="hover:scale-110 transition-transform drop-shadow-2xl"
          />
        </div>
      )}

      {/* Falling Click Effects */}
      {fallingClicks.map((click) => (
        <div
          key={click.id}
          style={{
            position: 'fixed',
            left: `${click.x}px`,
            top: `${click.y}px`,
            zIndex: 999,
            animation: 'fall 2s ease-in forwards',
          }}
        >
          <Image
            src="/click.webp"
            alt="Click"
            width={50}
            height={50}
            className="pointer-events-none"
          />
        </div>
      ))}

      {/* Floating Meme Images */}
      {floatingMemes.map((meme) => (
        <div
          key={meme.id}
          style={{
            position: 'fixed',
            ...(meme.direction === 'left-to-right' ? {
              left: '-150px',
              top: `${meme.startPos}px`,
              animation: 'slideLeftToRight 8s linear forwards',
            } : meme.direction === 'right-to-left' ? {
              right: '-150px',
              top: `${meme.startPos}px`,
              animation: 'slideRightToLeft 8s linear forwards',
            } : meme.direction === 'top-to-bottom' ? {
              top: '-150px',
              left: `${meme.startPos}px`,
              animation: 'slideTopToBottom 8s linear forwards',
            } : {
              bottom: '-150px',
              left: `${meme.startPos}px`,
              animation: 'slideBottomToTop 8s linear forwards',
            }),
            zIndex: 10,
          }}
        >
          <Image
            src={`/upgradePhoto/${meme.upgradeId}.webp`}
            alt={meme.upgradeId}
            width={120}
            height={120}
            className="pointer-events-none opacity-80"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      ))}

      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(500px) rotate(360deg);
            opacity: 0;
          }
        }
        
        @keyframes slideLeftToRight {
          0% {
            left: -150px;
            transform: rotate(-15deg);
          }
          50% {
            transform: rotate(15deg);
          }
          100% {
            left: 100vw;
            transform: rotate(-15deg);
          }
        }
        
        @keyframes slideRightToLeft {
          0% {
            right: -150px;
            transform: rotate(-15deg);
          }
          50% {
            transform: rotate(15deg);
          }
          100% {
            right: 100vw;
            transform: rotate(-15deg);
          }
        }
        
        @keyframes slideTopToBottom {
          0% {
            top: -150px;
            transform: rotate(-15deg);
          }
          50% {
            transform: rotate(15deg);
          }
          100% {
            top: 100vh;
            transform: rotate(-15deg);
          }
        }
        
        @keyframes slideBottomToTop {
          0% {
            bottom: -150px;
            transform: rotate(-15deg);
          }
          50% {
            transform: rotate(15deg);
          }
          100% {
            bottom: 100vh;
            transform: rotate(-15deg);
          }
        }
      `}</style>
    </div>
  );
}
