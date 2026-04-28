import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';

interface IPCharacterProps {
  onClick: () => void;
  disabled?: boolean;
}

export function IPCharacter({ onClick, disabled }: IPCharacterProps) {
  const [currentAction, setCurrentAction] = useState<1 | 2>(1);
  const [showBubble, setShowBubble] = useState(true);

  useEffect(() => {
    // Switch action every 1 minute (60000 ms)
    const actionInterval = setInterval(() => {
      setCurrentAction(prev => prev === 1 ? 2 : 1);
    }, 60000);

    return () => clearInterval(actionInterval);
  }, []);

  useEffect(() => {
    // Hide initial bubble after 8 seconds
    const initialTimer = setTimeout(() => setShowBubble(false), 8000);

    // Show bubble every 3 minutes (180000 ms)
    const bubbleInterval = setInterval(() => {
      setShowBubble(true);
      // Hide it again after 8 seconds
      setTimeout(() => setShowBubble(false), 8000);
    }, 180000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(bubbleInterval);
    };
  }, []);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "absolute bottom-10 right-10 z-30 transition-transform hover:scale-105 active:scale-95",
        "flex flex-col items-center justify-center",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {/* Call to action bubble */}
      <div 
        className={cn(
          "absolute -top-16 bg-white text-black text-base md:text-lg font-bold px-6 py-3 rounded-full shadow-xl whitespace-nowrap transition-all duration-500",
          showBubble ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        <span>点我施展魔法！✨</span>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-white" />
      </div>

      {/* Character Image Container (Enlarged 1.5x) */}
      <div className="relative w-48 h-48 md:w-60 md:h-60">
        <img
          key={currentAction}
          src={`/dino-action-${currentAction}.png`}
          alt="IP Character"
          className="absolute inset-0 w-full h-full object-contain drop-shadow-2xl transition-opacity duration-500"
          onError={(e) => {
            // Fallback if image is not found
            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=dino${currentAction}&backgroundColor=b6e3f4`;
          }}
        />
      </div>
    </button>
  );
}
