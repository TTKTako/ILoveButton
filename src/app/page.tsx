"use client";

import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [score, setScore] = useState(0);
  const [isPressed, setIsPressed] = useState(false);
  const buttonSkin = "default";

  const handleClick = () => {
    setScore(score + 1);
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white flex-col">
      <div className="mb-4 text-4xl font-bold text-black absolute top-4 flex flex-col gap-2 align-center justify-center text-center">
        <h1 className="font-bold text-black text-3xl">Score {score}</h1>
        <h1 className="font-semibold text-black text-lg">earn {'temp'} clicks/sec</h1>
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
