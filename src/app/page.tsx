"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import UpgradeShop from "@/components/UpgradeShop";
import SkinShop from "@/components/SkinShop";
import UpgradePopup from "@/components/UpgradePopup";
import { Upgrade, ButtonSkin, GameState, UpgradeState, SingleUpgrade, SingleUpgradeState } from "@/types/game";
import {
  loadGameState,
  saveGameState,
  resetGameState,
  calculateUpgradePrice,
  calculateBulkUpgradePrice,
  calculateTotalCPS,
  safeAdd,
  safeSubtract,
  formatNumber,
  getManualClickValue,
} from "@/utils/gameStorage";

export default function Home() {
  const [score, setScore] = useState(0);
  const [isPressed, setIsPressed] = useState(false);
  const [clicksPerSec, setClicksPerSec] = useState(0);
  const [buttonSkin, setButtonSkin] = useState("default");
  const [upgrades, setUpgrades] = useState<UpgradeState>({});
  const [purchasedSkins, setPurchasedSkins] = useState<string[]>(["default"]);
  const [singleUpgrades, setSingleUpgrades] = useState<SingleUpgradeState>({});
  
  const [upgradeData, setUpgradeData] = useState<Upgrade[]>([]);
  const [skinData, setSkinData] = useState<ButtonSkin[]>([]);
  const [singleUpgradeData, setSingleUpgradeData] = useState<SingleUpgrade[]>([]);
  
  const [isUpgradeShopOpen, setIsUpgradeShopOpen] = useState(false);
  const [isSkinShopOpen, setIsSkinShopOpen] = useState(false);
  const [showEndgameVideo, setShowEndgameVideo] = useState(false);
  const [showEndgameChoice, setShowEndgameChoice] = useState(false);
  const [isGalaxyMode, setIsGalaxyMode] = useState(false);
  const [showEndgameDialogs, setShowEndgameDialogs] = useState(false);
  const [currentDialogIndex, setCurrentDialogIndex] = useState(0);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [adPosition, setAdPosition] = useState<{ x: number; y: number } | null>(null);
  const [fallingClicks, setFallingClicks] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [floatingMemes, setFloatingMemes] = useState<Array<{ 
    id: number; 
    upgradeId: string; 
    direction: 'left-to-right' | 'right-to-left' | 'top-to-bottom' | 'bottom-to-top';
    startPos: number;
  }>>([]);
  const [cursorEffects, setCursorEffects] = useState<Array<{ 
    id: number; 
    startX: number; 
    startY: number;
    size: number;
    curveDirection: 'left' | 'right';
    force: number;
  }>>([]);
  
  const clickTimestamps = useRef<number[]>([]);
  const hasLoadedData = useRef(false);
  const fallingClickIdRef = useRef(0);
  const memeIdRef = useRef(0);
  const cursorEffectIdRef = useRef(0);

  // Load game data from JSON files
  useEffect(() => {
    const loadData = async () => {
      try {
        const [upgradeRes, skinRes, singleUpgradeRes] = await Promise.all([
          fetch("/data/upgrade.json"),
          fetch("/data/buttonSkin.json"),
          fetch("/data/singleupgrade.json"),
        ]);
        
        const upgradeJson = await upgradeRes.json();
        const skinJson = await skinRes.json();
        const singleUpgradeJson = await singleUpgradeRes.json();
        
        setUpgradeData(upgradeJson.upgrades || []);
        setSkinData(skinJson.ButtonSkins || []);
        setSingleUpgradeData(singleUpgradeJson.singleUpgrades || []);
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
    setSingleUpgrades(gameState.singleUpgrades || {});
    
    // Check if first time visitor
    const hasVisited = localStorage.getItem('hasVisitedBefore');
    if (!hasVisited) {
      setShowWelcomePopup(true);
      localStorage.setItem('hasVisitedBefore', 'true');
    }
  }, []);

  // Save game state whenever it changes
  useEffect(() => {
    if (!hasLoadedData.current) return;
    
    const gameState: GameState = {
      score,
      upgrades,
      purchasedSkins,
      equippedSkin: buttonSkin,
      singleUpgrades,
    };
    
    saveGameState(gameState);
  }, [score, upgrades, purchasedSkins, buttonSkin, singleUpgrades]);

  // Auto-click from upgrades (CPS)
  useEffect(() => {
    if (upgradeData.length === 0) return; // Wait for upgrade data to load
    
    const totalCPS = calculateTotalCPS(upgrades, upgradeData, singleUpgrades, singleUpgradeData);
    
    if (totalCPS > 0) {
      const interval = setInterval(() => {
        setScore((prevScore) => safeAdd(prevScore, totalCPS / 10)); // Update 10 times per second
      }, 100);
      
      return () => clearInterval(interval);
    }
  }, [upgrades, upgradeData, singleUpgrades, singleUpgradeData]);

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

  const handleClick = (event: React.MouseEvent<HTMLImageElement>) => {
    const clickValue = getManualClickValue(singleUpgrades, singleUpgradeData);
    setScore((prevScore) => safeAdd(prevScore, clickValue));
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

    // Create cursor effects (2-5 cursors)
    const numCursors = 1; // 2-5 cursors
    const buttonRect = event.currentTarget.getBoundingClientRect();
    const buttonCenterX = buttonRect.left + buttonRect.width / 2;
    const buttonCenterY = buttonRect.top + buttonRect.height / 2;

    for (let i = 0; i < numCursors; i++) {
      const cursorId = cursorEffectIdRef.current++;
      const size = Math.random() * 20 + 15; // Random size between 15-35px
      const curveDirection = Math.random() > 0.5 ? 'left' : 'right';
      const force = Math.random() * 0.6 + 0.7; // Random force between 0.7-1.3 for varied trajectories
      
      setTimeout(() => {
        setCursorEffects((prev) => [...prev, {
          id: cursorId,
          startX: buttonCenterX,
          startY: buttonCenterY,
          size,
          curveDirection,
          force,
        }]);

        // Remove cursor effect after animation completes
        setTimeout(() => {
          setCursorEffects((prev) => prev.filter((cursor) => cursor.id !== cursorId));
        }, 1500);
      }, i * 50); // Stagger the appearance slightly
    }
  };

  const handlePurchaseUpgrade = (upgradeId: string, quantity: number = 1) => {
    const upgrade = upgradeData.find((u) => u.id === upgradeId);
    if (!upgrade) return;
    
    const currentCount = upgrades[upgradeId] || 0;
    const price = quantity === 1 
      ? calculateUpgradePrice(upgrade.base_price, currentCount)
      : calculateBulkUpgradePrice(upgrade.base_price, currentCount, quantity);
    
    if (score >= price) {
      setScore((prevScore) => safeSubtract(prevScore, price));
      setUpgrades((prev) => ({
        ...prev,
        [upgradeId]: currentCount + quantity,
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
    
    const totalCPS = calculateTotalCPS(upgrades, upgradeData, singleUpgrades, singleUpgradeData);
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
      setSingleUpgrades({});
      clickTimestamps.current = [];
      setClicksPerSec(0);
      resetGameState();
      localStorage.removeItem('hasVisitedBefore');
      setShowWelcomePopup(true);
    }
  };

  const handlePurchaseSingleUpgrade = (upgradeId: string, level: number) => {
    const upgrade = singleUpgradeData.find((u) => u.id === upgradeId);
    if (!upgrade) return;
    
    const levelData = upgrade.levels.find((l) => l.level === level);
    if (!levelData) return;
    
    // Check if already owned
    const upgradeState = singleUpgrades[upgradeId] || {};
    if (upgradeState[level]) return;
    
    // Check price
    if (score < levelData.price) return;
    
    // Check unlock requirement
    const baseCount = upgrades[upgrade.baseUpgradeId] || 0;
    if (upgrade.baseUpgradeId !== 'manual' && 
        upgrade.baseUpgradeId !== 'global' && 
        upgrade.baseUpgradeId !== 'endgame' &&
        baseCount < levelData.unlockRequirement) {
      return;
    }
    
    // Purchase
    setScore((prevScore) => safeSubtract(prevScore, levelData.price));
    setSingleUpgrades((prev) => ({
      ...prev,
      [upgradeId]: {
        ...(prev[upgradeId] || {}),
        [level]: true,
      },
    }));

    // Check if this is the endgame upgrade
    if (upgradeId === 'endgame_upgrade') {
      setShowEndgameDialogs(true);
      setCurrentDialogIndex(0);
    }
  };

  const totalCPS = calculateTotalCPS(upgrades, upgradeData, singleUpgrades, singleUpgradeData);

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

  const manualClickValue = getManualClickValue(singleUpgrades, singleUpgradeData);
  const effectiveManualCPS = clicksPerSec * manualClickValue;

  const handleReplay = () => {
    setScore(0);
    setUpgrades({});
    setPurchasedSkins(["default"]);
    setButtonSkin("default");
    setSingleUpgrades({});
    clickTimestamps.current = [];
    setClicksPerSec(0);
    setShowEndgameVideo(false);
    setShowEndgameChoice(false);
    setIsGalaxyMode(false);
    setShowEndgameDialogs(false);
    setCurrentDialogIndex(0);
    resetGameState();
    localStorage.removeItem('hasVisitedBefore');
    setShowWelcomePopup(true);
  };

  const handleContinuePlaying = () => {
    setShowEndgameChoice(false);
    setShowEndgameDialogs(false);
    setCurrentDialogIndex(0);
    setIsGalaxyMode(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white flex-col relative overflow-hidden">
      {/* Galaxy Background Video */}
      {isGalaxyMode && (
        <video
          autoPlay
          loop
          muted
          className="fixed inset-0 w-full h-full object-cover z-0"
        >
          <source src="/blackhole.mp4" type="video/mp4" />
        </video>
      )}

      {/* Endgame Blackhole Background with Dialogs */}
      {showEndgameDialogs && !showEndgameChoice && (
        <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
          <video
            autoPlay
            loop
            muted
            className="fixed inset-0 w-full h-full object-cover z-0"
          >
            <source src="/blackhole.mp4" type="video/mp4" />
          </video>
          
          {/* Dialog Overlay */}
          <div className="relative z-10 flex items-center justify-center w-full h-full p-4">
            <div className="bg-black/70 backdrop-blur-md rounded-2xl shadow-2xl p-6 sm:p-8 max-w-2xl w-full text-center border-2 border-purple-500">
              <div className="text-white space-y-4">
                {currentDialogIndex === 0 && (
                  <>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-purple-300 mb-4">🌌 Congratulations! 🌌</h2>
                    <p className="text-base sm:text-lg md:text-xl leading-relaxed">
                      You've done it! You've clicked your way to the ultimate achievement!
                    </p>
                  </>
                )}
                {currentDialogIndex === 1 && (
                  <>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-300 mb-4">✨ The Journey ✨</h2>
                    <p className="text-base sm:text-lg md:text-xl leading-relaxed">
                      From a simple button to mastering the universe itself...
                      Your determination has been extraordinary!
                    </p>
                  </>
                )}
                {currentDialogIndex === 2 && (
                  <>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-300 mb-4">🎮 Victory! 🎮</h2>
                    <p className="text-base sm:text-lg md:text-xl leading-relaxed">
                      You are now the supreme Clicker of the Galaxy!
                      The cosmos bends to your clicking prowess!
                    </p>
                  </>
                )}
                {currentDialogIndex === 3 && (
                  <>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-yellow-300 mb-4">🎉 Thank You! 🎉</h2>
                    <p className="text-base sm:text-lg md:text-xl leading-relaxed mb-6">
                      Thank you for playing this game to the end!
                      Your dedication means everything!
                    </p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-pink-400">
                      Game by: TTKTako (TarKubz)
                    </p>
                  </>
                )}
              </div>
              
              <button
                onClick={() => {
                  if (currentDialogIndex < 3) {
                    setCurrentDialogIndex(currentDialogIndex + 1);
                  } else {
                    setShowEndgameDialogs(false);
                    setShowEndgameChoice(true);
                  }
                }}
                className="mt-6 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-lg text-base sm:text-lg md:text-xl transition-all hover:scale-105 shadow-lg"
              >
                {currentDialogIndex < 3 ? 'Continue ➜' : 'What\'s Next? ➜'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Endgame Choice Modal */}
      {showEndgameChoice && (
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-lg flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 max-w-md w-full text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black mb-4">🌌 You've Reached The End! 🌌</h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-700 mb-6 sm:mb-8">
              You have become the Clicker of the Galaxy. What will you do now?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button
                onClick={handleReplay}
                className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg text-sm sm:text-base md:text-lg transition-all hover:scale-105"
              >
                🔄 Replay from Start
              </button>
              <button
                onClick={handleContinuePlaying}
                className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-lg text-sm sm:text-base md:text-lg transition-all hover:scale-105"
              >
                🌠 Continue in Galaxy Mode
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Popup for First Time Visitors */}
      {showWelcomePopup && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-lg flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-purple-600 mb-4 sm:mb-6">
              🎮 Welcome to I Love Button! 🎮
            </h1>
            
            <div className="space-y-3 sm:space-y-4 text-left mb-4 sm:mb-6">
              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border-l-4 border-blue-500">
                <h3 className="font-bold text-blue-900 mb-2">👨‍💻 Creator:</h3>
                <p className="text-sm text-gray-700">
                  <strong>TTKTako</strong><br/>
                  <a href="https://github.com/TTKTako" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    GitHub: github.com/TTKTako
                  </a><br/>
                  <a href="https://buymeacoffee.com/ttktako" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    ☕ Buy me a coffee: buymeacoffee.com/ttktako
                  </a>
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <h3 className="font-bold text-green-900 mb-2">💾 Data Save:</h3>
                <p className="text-sm text-gray-700">
                  Your data will be saved <strong>locally</strong> on your browser. If you change devices or clear your browser data, your progress will not be migrated.
                </p>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
                <h3 className="font-bold text-orange-900 mb-2">⏱️ Estimated Playtime:</h3>
                <p className="text-sm text-gray-700">
                  <strong>10-20 hours</strong> of engaging clicker gameplay with multiple upgrade paths and an endgame goal!
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                <h3 className="font-bold text-purple-900 mb-2">📝 Description:</h3>
                <p className="text-sm text-gray-700">
                  This game is made for <strong>fun</strong>, not for selling purposes. I hope you enjoy it! 
                  Click the button, buy upgrades, and work your way to becoming the Clicker of the Galaxy! 🌌
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowWelcomePopup(false)}
              className="w-full px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-lg text-lg sm:text-xl transition-all hover:scale-105 shadow-lg"
            >
              🚀 Start Clicking!
            </button>
          </div>
        </div>
      )}

      {!showEndgameVideo && !showEndgameDialogs && (
        <>
      <div className="mb-4 text-4xl font-bold text-black absolute top-4 flex flex-col gap-2 align-center justify-center text-center w-max z-50 px-2 sm:px-0">
        <h1 className="font-bold text-black text-xl sm:text-2xl md:text-3xl">{formatNumber(score)} Click(s)</h1>
        <h1 className="font-semibold text-black text-sm sm:text-base md:text-lg">
          Total: {formatNumber(totalCPS + effectiveManualCPS)} clicks/sec
        </h1>
        <div className="text-xs sm:text-sm text-gray-600">
          Manual: {formatNumber(effectiveManualCPS)}/s | Auto: {formatNumber(totalCPS)}/s
        </div>
        <div className="flex flex-row gap-2 text-sm sm:text-base md:text-lg justify-center">
          <button
            onClick={() => setIsUpgradeShopOpen(true)}
            className="shadow-lg px-3 py-1 sm:px-4 sm:py-2 border rounded text-black text-center bg-blue-100 hover:bg-blue-200 cursor-pointer relative"
          >
            Upgrade
            {canAffordAnyUpgrade && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </button>
          <button
            onClick={() => setIsSkinShopOpen(true)}
            className="shadow-lg px-3 py-1 sm:px-4 sm:py-2 border rounded text-black text-center bg-yellow-100 hover:bg-yellow-200 cursor-pointer relative"
          >
            Skin
            {canAffordAnySkin && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </button>
        </div>
      </div>

      {/* Settings Button - Top Left */}
      <button
        onClick={() => setShowWelcomePopup(true)}
        className="absolute top-4 left-4 z-50 shadow-lg px-2 py-1 sm:px-4 sm:py-2 border rounded text-black text-center bg-gray-100 hover:bg-gray-200 cursor-pointer transition-all hover:scale-105 text-xs sm:text-sm md:text-base"
        title="Settings & Info"
      >
        <span className="hidden sm:inline">⚙️ Settings</span>
        <span className="sm:hidden">⚙️</span>
      </button>

      {/* Upgrade Popup - Top Right Corner */}
      <UpgradePopup
        singleUpgrades={singleUpgradeData}
        singleUpgradeState={singleUpgrades}
        baseUpgradeState={upgrades}
        score={score}
        onPurchase={handlePurchaseSingleUpgrade}
      />
      
      <div className="text-center h-2/3 flex flex-col justify-center z-1000 px-4">
        <Image
          src={`/button/${buttonSkin}/${isPressed ? 'press' : 'unpress'}.png`}
          alt="Logo"
          width={200}
          height={200}
          className="mx-auto cursor-pointer w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-52 lg:h-52"
          onClick={handleClick}
        />
      </div>
      
      <p
        className="absolute bottom-3 right-4 text-xs sm:text-sm text-gray-500 hover:underline hover:text-red-500 cursor-pointer"
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
        singleUpgrades={singleUpgrades}
        singleUpgradeData={singleUpgradeData}
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

      {/* Cursor Effects */}
      {cursorEffects.map((cursor) => (
        <div
          key={cursor.id}
          style={{
            position: 'fixed',
            left: `${cursor.startX}px`,
            top: `${cursor.startY}px`,
            zIndex: 999,
            animation: `cursorFloat${cursor.curveDirection === 'left' ? 'Left' : 'Right'}${Math.round(cursor.force * 10)} 1.5s ease-out forwards`,
            pointerEvents: 'none',
          }}
        >
          <Image
            src="/click.webp"
            alt="Click"
            width={cursor.size}
            height={cursor.size}
            className="pointer-events-none"
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
        
        @keyframes cursorFloatLeft7 {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: translate(-56px, -105px) rotate(-180deg);
            opacity: 0.8;
          }
          100% {
            transform: translate(-42px, 70px) rotate(-360deg);
            opacity: 0;
          }
        }
        
        @keyframes cursorFloatLeft8 {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: translate(-64px, -120px) rotate(-180deg);
            opacity: 0.8;
          }
          100% {
            transform: translate(-48px, 80px) rotate(-360deg);
            opacity: 0;
          }
        }
        
        @keyframes cursorFloatLeft9 {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: translate(-72px, -135px) rotate(-180deg);
            opacity: 0.8;
          }
          100% {
            transform: translate(-54px, 90px) rotate(-360deg);
            opacity: 0;
          }
        }
        
        @keyframes cursorFloatLeft10 {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: translate(-80px, -150px) rotate(-180deg);
            opacity: 0.8;
          }
          100% {
            transform: translate(-60px, 100px) rotate(-360deg);
            opacity: 0;
          }
        }
        
        @keyframes cursorFloatLeft11 {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: translate(-88px, -165px) rotate(-180deg);
            opacity: 0.8;
          }
          100% {
            transform: translate(-66px, 110px) rotate(-360deg);
            opacity: 0;
          }
        }
        
        @keyframes cursorFloatLeft12 {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: translate(-96px, -180px) rotate(-180deg);
            opacity: 0.8;
          }
          100% {
            transform: translate(-72px, 120px) rotate(-360deg);
            opacity: 0;
          }
        }
        
        @keyframes cursorFloatLeft13 {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: translate(-104px, -195px) rotate(-180deg);
            opacity: 0.8;
          }
          100% {
            transform: translate(-78px, 130px) rotate(-360deg);
            opacity: 0;
          }
        }
        
        @keyframes cursorFloatRight7 {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: translate(56px, -105px) rotate(180deg);
            opacity: 0.8;
          }
          100% {
            transform: translate(42px, 70px) rotate(360deg);
            opacity: 0;
          }
        }
        
        @keyframes cursorFloatRight8 {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: translate(64px, -120px) rotate(180deg);
            opacity: 0.8;
          }
          100% {
            transform: translate(48px, 80px) rotate(360deg);
            opacity: 0;
          }
        }
        
        @keyframes cursorFloatRight9 {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: translate(72px, -135px) rotate(180deg);
            opacity: 0.8;
          }
          100% {
            transform: translate(54px, 90px) rotate(360deg);
            opacity: 0;
          }
        }
        
        @keyframes cursorFloatRight10 {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: translate(80px, -150px) rotate(180deg);
            opacity: 0.8;
          }
          100% {
            transform: translate(60px, 100px) rotate(360deg);
            opacity: 0;
          }
        }
        
        @keyframes cursorFloatRight11 {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: translate(88px, -165px) rotate(180deg);
            opacity: 0.8;
          }
          100% {
            transform: translate(66px, 110px) rotate(360deg);
            opacity: 0;
          }
        }
        
        @keyframes cursorFloatRight12 {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: translate(96px, -180px) rotate(180deg);
            opacity: 0.8;
          }
          100% {
            transform: translate(72px, 120px) rotate(360deg);
            opacity: 0;
          }
        }
        
        @keyframes cursorFloatRight13 {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: translate(104px, -195px) rotate(180deg);
            opacity: 0.8;
          }
          100% {
            transform: translate(78px, 130px) rotate(360deg);
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
        </>
      )}
    </div>
  );
}
