import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import { Drawing } from '../types';

interface MoviePlayerProps {
  drawings: Drawing[];
  onClose: () => void;
}

export const MoviePlayer: React.FC<MoviePlayerProps> = ({ drawings, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    let timer: number;
    if (isPlaying && drawings.length > 0) {
      timer = window.setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % drawings.length);
      }, 2000); // 2 seconds per frame
    }
    return () => clearInterval(timer);
  }, [isPlaying, drawings.length]);

  if (drawings.length === 0) return null;

  const currentDrawing = drawings[currentIndex];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-50 text-zinc-900 transition-colors duration-500">
      <header className="flex items-center justify-between p-4 bg-gradient-to-b from-zinc-50/80 to-transparent z-10 absolute top-0 left-0 right-0">
        <h2 className="text-xl font-bold">回忆放映室</h2>
        <button 
          onClick={onClose}
          className="p-2 rounded-full bg-zinc-200 hover:bg-zinc-300 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </header>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex items-center justify-center p-8"
          >
            <img 
              src={currentDrawing.refinedImage || currentDrawing.originalImage} 
              alt={`Frame ${currentIndex + 1}`}
              className="w-full h-full object-cover drop-shadow-2xl rounded-2xl"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="p-6 bg-gradient-to-t from-zinc-50/80 to-transparent z-10 absolute bottom-0 left-0 right-0">
        <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setCurrentIndex((prev) => (prev - 1 + drawings.length) % drawings.length)}
              className="p-3 rounded-full bg-zinc-200 hover:bg-zinc-300 transition-colors"
            >
              <SkipBack className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-4 rounded-full bg-zinc-900 text-white hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current" />}
            </button>
            <button 
              onClick={() => setCurrentIndex((prev) => (prev + 1) % drawings.length)}
              className="p-3 rounded-full bg-zinc-200 hover:bg-zinc-300 transition-colors"
            >
              <SkipForward className="w-6 h-6" />
            </button>
          </div>
          <div className="w-full h-1 bg-zinc-300 rounded-full overflow-hidden">
            <div 
              className="h-full bg-zinc-900 transition-all duration-300 ease-linear"
              style={{ width: `${((currentIndex + 1) / drawings.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
