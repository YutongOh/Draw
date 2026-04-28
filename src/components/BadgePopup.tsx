import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Badge } from '../constants/badges';
import { Award, X } from 'lucide-react';

interface BadgePopupProps {
  badge: Badge | null;
  onClose: () => void;
}

export const BadgePopup: React.FC<BadgePopupProps> = ({ badge, onClose }) => {
  return (
    <AnimatePresence>
      {badge && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white\/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 50, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="relative w-full max-w-md bg-white border border-zinc-200 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-b from-dino-green/20 to-transparent pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-dino-green/10 rounded-full blur-3xl pointer-events-none" />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative mb-6">
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-32 h-32 rounded-full bg-gradient-to-br from-dino-green to-emerald-600 p-1 shadow-lg shadow-dino-green/30"
              >
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center overflow-hidden relative">
                  <img 
                    src={badge.icon} 
                    alt={badge.name}
                    className="w-full h-full object-cover z-10"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <Award className="w-16 h-16 text-dino-green hidden absolute" />
                </div>
              </motion.div>
              
              {/* Sparkles */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[-20px] border-[2px] border-dashed border-dino-green/30 rounded-full pointer-events-none"
              />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-3xl font-display font-bold text-zinc-900 mb-2">
                获得新徽章！
              </h2>
              <h3 className="text-xl font-bold text-dino-green mb-4">
                {badge.name}
              </h3>
              <p className="text-zinc-600 mb-6 leading-relaxed">
                {badge.message}
              </p>
              
              <div className="inline-block px-4 py-2 rounded-full bg-zinc-100 border border-zinc-200 text-sm text-zinc-500">
                达成条件：{badge.description}
              </div>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              onClick={onClose}
              className="mt-8 px-8 py-3 rounded-2xl bg-dino-green text-black font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-lg shadow-dino-green/20"
            >
              开心收下
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
