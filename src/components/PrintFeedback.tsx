import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Printer, CheckCircle2, Loader2, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Drawing } from '../types';

interface PrintFeedbackProps {
  drawing: Drawing;
  onClose: () => void;
}

export const PrintFeedback: React.FC<PrintFeedbackProps> = ({ drawing, onClose }) => {
  const [status, setStatus] = useState<'printing' | 'success'>('printing');

  useEffect(() => {
    const timer = setTimeout(() => {
      setStatus('success');
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4ade80', '#ffffff', '#166534']
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-white/80 backdrop-blur-xl">
      <button 
        onClick={onClose}
        className="absolute top-8 right-8 p-3 rounded-full bg-zinc-100 hover:bg-zinc-100 transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="max-w-md w-full text-center">
        <AnimatePresence mode="wait">
          {status === 'printing' ? (
            <motion.div
              key="printing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="flex flex-col items-center"
            >
              <div className="w-32 h-32 relative mb-8">
                <motion.div 
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 2, -2, 0]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Printer className="w-20 h-20 text-dino-green" />
                </motion.div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                  <Loader2 className="w-8 h-8 text-zinc-900 animate-spin" />
                </div>
              </div>
              <h2 className="text-3xl font-display font-bold mb-4">正在打印中...</h2>
              <p className="text-zinc-500">迪诺正在把你的画作变到纸上，请稍等一下哦！</p>
              
              <div className="mt-12 w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 3, ease: "linear" }}
                  className="h-full bg-dino-green"
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center"
            >
              <div className="w-32 h-32 bg-dino-green rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-dino-green/40">
                <CheckCircle2 className="w-16 h-16 text-zinc-900" />
              </div>
              <h2 className="text-3xl font-display font-bold mb-4">打印成功！</h2>
              <p className="text-zinc-500 mb-12">快去看看你的漂亮画作吧，你真是一个小画家！</p>
              
              <div className="relative group mb-12">
                <img 
                  src={drawing.refinedImage || drawing.originalImage} 
                  className="w-64 aspect-video object-cover rounded-2xl border-4 border-zinc-200 shadow-2xl rotate-3 group-hover:rotate-0 transition-transform"
                />
                <div className="absolute -top-4 -right-4 bg-yellow-400 text-zinc-950 font-bold px-4 py-2 rounded-xl shadow-lg -rotate-12">
                  100分!
                </div>
              </div>

              <button 
                onClick={onClose}
                className="w-full py-5 rounded-2xl bg-zinc-100 text-zinc-900 font-bold text-lg hover:bg-zinc-200 transition-colors"
              >
                太棒了，继续画画
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
