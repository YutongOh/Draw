import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Sun, Moon } from 'lucide-react';
import { AgeGroup } from '../types';

interface AgeSelectionProps {
  onSelect: (age: AgeGroup) => void;
  onGallery: () => void;
  onParentMode: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const AgeSelection: React.FC<AgeSelectionProps> = ({ onSelect, onGallery, onParentMode, theme, onToggleTheme }) => {
  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center p-4 md:p-8 select-none relative" style={{ background: 'linear-gradient(to bottom, #C6FFFF 10%, #E7FFFE 50%)' }}>
      
      <div className="absolute top-8 right-8 flex items-center gap-4">
        {/* Theme Toggle Button */}
        <button 
          onClick={onToggleTheme}
          className="flex items-center gap-2 px-4 py-2 bg-white/40 hover:bg-white/60 backdrop-blur-md rounded-full text-zinc-700 font-bold transition-all shadow-sm border border-white/50"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          {theme === 'light' ? '夜间模式' : '日间模式'}
        </button>

        {/* Parent Mode Button */}
        <button 
          onClick={onParentMode}
          className="flex items-center gap-2 px-4 py-2 bg-white/40 hover:bg-white/60 backdrop-blur-md rounded-full text-zinc-700 font-bold transition-all shadow-sm border border-white/50"
        >
          <ShieldCheck className="w-5 h-5" />
          家长模式
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 xl:gap-12 max-w-7xl 2xl:max-w-[1600px] w-full">
        
        {/* Basic Drawing Card */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => onSelect('2-4')}
          className="group relative flex flex-col items-center justify-center p-6 lg:p-12 rounded-[40px] bg-gradient-to-b from-[#BBFFB3] to-[#D8FFC7] hover:scale-105 transition-transform duration-300 shadow-[0px_20px_0px_#86FF67] aspect-[3/4] xl:aspect-[4/5] max-h-[70vh]"
        >
          <div className="mb-4 lg:mb-8 relative w-32 h-32 lg:w-48 lg:h-48 flex items-center justify-center">
            {/* Basic Drawing Image */}
            <img 
              src="/mode-basic.png" 
              className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" 
              alt="自由涂画"
              referrerPolicy="no-referrer"
            />
          </div>
          <h2 className="text-2xl lg:text-4xl font-black font-local text-zinc-800 mb-2 lg:mb-3 tracking-tight text-center">自由涂画</h2>
          <p className="text-zinc-500 text-base lg:text-xl font-medium text-center">自由涂画发挥想象</p>
        </motion.button>

        {/* Advanced Drawing Card */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => onSelect('4-7')}
          className="group relative flex flex-col items-center justify-center p-6 lg:p-12 rounded-[40px] bg-gradient-to-b from-[#92FFD5] to-[#CAFFEB] hover:scale-105 transition-transform duration-300 shadow-[0px_20px_0px_#78FFD2] aspect-[3/4] xl:aspect-[4/5] max-h-[70vh]"
        >
          <div className="mb-4 lg:mb-8 relative w-32 h-32 lg:w-48 lg:h-48 flex items-center justify-center">
            {/* Advanced Drawing Image */}
            <img 
              src="/mode-advanced.png" 
              className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" 
              alt="引导绘画"
              referrerPolicy="no-referrer"
            />
          </div>
          <h2 className="text-2xl lg:text-4xl font-black font-local text-zinc-800 mb-2 lg:mb-3 tracking-tight text-center">引导绘画</h2>
          <p className="text-zinc-500 text-base lg:text-xl font-medium text-center">AI智能引导辅助发挥</p>
        </motion.button>

        {/* Memory Album Card */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={onGallery}
          className="group relative flex flex-col items-center justify-center p-6 lg:p-12 rounded-[40px] bg-gradient-to-b from-[#A6E3FF] to-[#D9F3FF] hover:scale-105 transition-transform duration-300 shadow-[0px_20px_0px_#91CFFF] aspect-[3/4] xl:aspect-[4/5] max-h-[70vh]"
        >
          <div className="mb-4 lg:mb-8 relative w-32 h-32 lg:w-48 lg:h-48 flex items-center justify-center">
            {/* Memory Album Image */}
            <img 
              src="/feature-album.png" 
              className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 rotate-[-5deg] group-hover:rotate-0" 
              alt="回忆画册"
              referrerPolicy="no-referrer"
            />
          </div>
          <h2 className="text-2xl lg:text-4xl font-black font-local text-zinc-800 mb-2 lg:mb-3 tracking-tight text-center">回忆画册</h2>
          <p className="text-zinc-500 text-base lg:text-xl font-medium text-center">记录下绘画时光</p>
        </motion.button>

      </div>
    </div>
  );
};
