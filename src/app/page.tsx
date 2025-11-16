"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [score, setScore] = useState(0);
  const [isPressed, setIsPressed] = useState(false);
  const [clicksPerSec, setClicksPerSec] = useState(0);
  const buttonSkin = "default";
  const clickTimestamps = useRef<number[]>([]);

  const handleClick = () => {
    setScore(score + 1);
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-white flex-col">
      <div className="mb-4 text-4xl font-bold text-black absolute top-4 flex flex-col gap-2 align-center justify-center text-center w-max">
        <h1 className="font-bold text-black text-3xl">{score} Click(s)</h1>
        <h1 className="font-semibold text-black text-lg">earn {clicksPerSec} clicks/sec</h1>
      </div>
      <div className="text-center h-2/3 flex flex-col justify-center">
        <Image
          src={`/button/${buttonSkin}/${isPressed ? 'press' : 'unpress'}.png`}
          alt="Logo"
          width={200}
          height={200}
          className="mx-auto cursor-pointer"
          onClick={handleClick}
        />
      </div>
    </div>
  );
}
