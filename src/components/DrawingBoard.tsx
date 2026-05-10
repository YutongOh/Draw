import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Eraser, 
  Pencil, 
  Wand2, 
  RotateCcw, 
  Download, 
  Printer, 
  Lightbulb,
  ChevronLeft,
  History,
  Check,
  X,
  Award
} from 'lucide-react';
import { cn, touchOrHoverOverlay } from '../lib/utils';
import { AgeGroup, Drawing } from '../types';
import { refineDrawing, getInspiration } from '../services/aiService';
import { getInspirationImageUrl, InspirationItem } from '../constants/inspirations';
import { IPCharacter } from './IPCharacter';
import { BadgePopup } from './BadgePopup';
import { BADGES, Badge } from '../constants/badges';

interface DrawingBoardProps {
  ageGroup: AgeGroup;
  initialDrawing?: Drawing | null;
  onBack: () => void;
  onGallery: () => void;
  onPrint: (drawing: Drawing) => void;
  onSave: (drawing: Drawing) => void;
}

export const DrawingBoard: React.FC<DrawingBoardProps> = ({ 
  ageGroup, 
  initialDrawing,
  onBack, 
  onGallery, 
  onPrint,
  onSave 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#4ade80');
  const [brushSize, setBrushSize] = useState(8);
  const [tool, setTool] = useState<'pencil' | 'eraser'>('pencil');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResults, setAiResults] = useState<string[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showInspiration, setShowInspiration] = useState(false);
  const [inspirations, setInspirations] = useState<InspirationItem[]>([]);
  const [selectedInspiration, setSelectedInspiration] = useState<InspirationItem | null>(null);
  const [showTrace, setShowTrace] = useState(false);
  const [testBadge, setTestBadge] = useState<Badge | null>(null);
  
  // Progress tracking
  const [, setStrokeCount] = useState(0);
  const [, setLastEncouragedStroke] = useState(0);

  // Feature gating
  const hasAI = ageGroup === '4-7';
  const hasInspiration = ageGroup === '4-7';
  const hasPrint = true; // Available for all age groups


  useEffect(() => {
    if (selectedInspiration) {
      setShowTrace(true);
    } else {
      setShowTrace(false);
    }
  }, [selectedInspiration]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        // Save current content
        const tempImage = canvas.toDataURL();
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Restore content
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = tempImage;
      }
    };

    const initCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (initialDrawing) {
          const img = new Image();
          img.onload = () => {
            // Calculate scaling to fit the image inside the canvas while maintaining aspect ratio
            const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
            const x = (canvas.width / 2) - (img.width / 2) * scale;
            const y = (canvas.height / 2) - (img.height / 2) * scale;
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
          };
          img.src = initialDrawing.refinedImage || initialDrawing.originalImage;
        }
      }
    };

    initCanvas();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [initialDrawing]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.beginPath();
      
      setStrokeCount(prev => prev + 1);
    }
  };

  const getCanvasDataURL = (maxSide = 1024) => {
    const canvas = canvasRef.current;
    if (!canvas) return '';
    const srcW = canvas.width;
    const srcH = canvas.height;

    // Scale down the exported image to keep payload size reasonable for APIs.
    const scale = Math.min(1, maxSide / Math.max(srcW, srcH));
    const outW = Math.max(1, Math.round(srcW * scale));
    const outH = Math.max(1, Math.round(srcH * scale));

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = outW;
    tempCanvas.height = outH;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      const isDark = document.querySelector('.dark') !== null;
      tempCtx.fillStyle = isDark ? '#18181b' : '#ffffff';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(canvas, 0, 0, srcW, srcH, 0, 0, outW, outH);
      return tempCanvas.toDataURL('image/png');
    }
    return '';
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineWidth = brushSize;
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
    }
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setAiResults([]);
      setStrokeCount(0);
      setLastEncouragedStroke(0);
    }
  };

  const handleMagic = async () => {
    if (!hasAI) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    setAiError(null);
    setIsProcessing(true);
    try {
      const base64 = getCanvasDataURL(1024);
      const results = await refineDrawing(base64, "a colorful drawing");
      if (results && results.length > 0) {
        setAiResults(results);
      } else {
        setAiError('智能美化暂时失败：未获得结果。可能是图片过大/接口限流/Key 无效。');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setAiError(`智能美化失败：${msg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const selectAiResult = (img: string) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      const image = new Image();
      image.onload = () => {
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        setAiResults([]);
      };
      image.src = img;
    }
  };

  const [isInspirationLoading, setIsInspirationLoading] = useState(false);

  const handleInspiration = async () => {
    if (!hasInspiration) return;
    setShowInspiration(true);
    if (inspirations.length === 0) {
      refreshInspirations();
    }
  };

  const refreshInspirations = async () => {
    setIsInspirationLoading(true);
    const ideas = await getInspiration(ageGroup);
    setInspirations(ideas);
    setIsInspirationLoading(false);
  };

  const saveDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const drawing: Drawing = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      originalImage: getCanvasDataURL(),
    };
    onSave(drawing);
  };

  return (
    <div className="h-screen h-[100dvh] flex flex-col bg-zinc-50 overflow-hidden select-none touch-none">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-zinc-200 bg-white backdrop-blur-2xl z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 sm:p-3 rounded-xl sm:rounded-2xl glass-button"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div>
            <h2 className="font-display font-bold text-lg tracking-tight">小小画板</h2>
            <p className="text-[10px] uppercase tracking-widest text-dino-green font-bold">{ageGroup} 岁创作模式</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              const randomBadge = BADGES[Math.floor(Math.random() * BADGES.length)];
              setTestBadge(randomBadge);
            }}
            className="flex items-center gap-2 p-2.5 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
          >
            <Award className="w-5 h-5" />
            <span className="hidden sm:inline font-medium">徽章测试</span>
          </button>
          <button 
            onClick={onGallery}
            className="flex items-center gap-2 p-2.5 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl glass-button"
          >
            <History className="w-5 h-5" />
            <span className="hidden sm:inline font-medium">作品库</span>
          </button>
          <button 
            onClick={saveDrawing}
            className="flex items-center gap-2 p-2.5 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl bg-dino-green/10 text-dino-green border border-dino-green/20 hover:bg-dino-green/20 transition-all"
          >
            <Download className="w-5 h-5" />
            <span className="hidden sm:inline font-medium">保存</span>
          </button>
          {hasPrint && (
            <button 
              onClick={() => {
                const canvas = canvasRef.current;
                if (canvas) onPrint({ id: 'temp', timestamp: Date.now(), originalImage: getCanvasDataURL() });
              }}
              className="p-2.5 rounded-2xl bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-100 transition-colors shadow-lg shadow-zinc-200/50"
            >
              <Printer className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative flex overflow-hidden">
        {/* Sidebar Tools */}
        <aside className="w-16 md:w-24 xl:w-32 p-2 md:p-4 xl:p-6 flex flex-col items-center gap-4 border-r border-zinc-200 bg-white/2 backdrop-blur-xl z-10 overflow-y-auto hide-scrollbar">
          <button 
            onClick={() => setTool('pencil')}
            className={cn(
              "p-3 md:p-4 xl:p-5 rounded-xl md:rounded-2xl transition-all duration-300 flex-shrink-0",
              tool === 'pencil' ? "text-black scale-110 shadow-xl" : "bg-white hover:bg-zinc-100"
            )}
            style={{
              backgroundColor: tool === 'pencil' ? color : undefined,
              boxShadow: tool === 'pencil' ? `0 0 15px ${color}4d` : undefined,
              color: tool !== 'pencil' ? color : '#000000'
            }}
          >
            <Pencil className="w-5 h-5 md:w-6 md:h-6 xl:w-8 xl:h-8" />
          </button>
          <button 
            onClick={() => setTool('eraser')}
            className={cn(
              "p-3 md:p-4 xl:p-5 rounded-xl md:rounded-2xl transition-all duration-300 flex-shrink-0",
              tool === 'eraser' ? "bg-zinc-900 text-white scale-110 shadow-xl shadow-zinc-900/30" : "bg-white text-zinc-500 hover:bg-zinc-100"
            )}
          >
            <Eraser className="w-5 h-5 md:w-6 md:h-6 xl:w-8 xl:h-8" />
          </button>
          
          <div className="w-full h-px bg-white my-2 flex-shrink-0" />

          {/* Brush Size Slider */}
          <div className="flex flex-col items-center gap-3 py-2 flex-shrink-0">
            {/* Preview Circle */}
            <div className="w-8 h-8 md:w-10 md:h-10 xl:w-14 xl:h-14 flex items-center justify-center bg-white rounded-full border border-zinc-200 shadow-inner overflow-hidden">
              <div 
                className="rounded-full transition-all duration-75"
                style={{
                  width: `${Math.min(brushSize, 30)}px`,
                  height: `${Math.min(brushSize, 30)}px`,
                  backgroundColor: tool === 'eraser' ? '#d4d4d8' : color,
                }}
              />
            </div>
            
            {/* Vertical Slider Container */}
            <div className="h-20 md:h-32 xl:h-40 flex items-center justify-center w-full relative">
              <input
                type="range"
                min="2"
                max="40"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="absolute w-20 md:w-32 xl:w-40 h-1.5 bg-zinc-100 rounded-lg appearance-none cursor-pointer -rotate-90 origin-center"
                style={{
                  accentColor: tool === 'eraser' ? '#d4d4d8' : color
                }}
              />
            </div>
          </div>

          <div className="w-full h-px bg-white my-2 flex-shrink-0" />
          
          <button 
            onClick={clearCanvas}
            className="p-3 md:p-4 xl:p-5 rounded-xl md:rounded-2xl bg-white text-zinc-500 hover:bg-red-500/20 hover:text-red-400 transition-all flex-shrink-0"
          >
            <RotateCcw className="w-5 h-5 md:w-6 md:h-6 xl:w-8 xl:h-8" />
          </button>

          <div className="mt-auto flex flex-col items-center gap-2 md:gap-3 xl:gap-4 flex-shrink-0">
            {['#4ade80', '#f87171', '#60a5fa', '#fbbf24', '#18181b'].map(c => (
              <button
                key={c}
                onClick={() => { setColor(c); setTool('pencil'); }}
                className={cn(
                  "w-8 h-8 md:w-10 md:h-10 xl:w-12 xl:h-12 rounded-full border-2 transition-all duration-300 hover:scale-125",
                  color === c ? "border-zinc-400 scale-110 shadow-lg" : "border-zinc-200"
                )}
                style={{ 
                  backgroundColor: c,
                  boxShadow: color === c ? `0 0 15px ${c}66` : 'none'
                }}
              />
            ))}
          </div>
        </aside>

        {/* Canvas Area */}
        <div className="flex-1 relative bg-zinc-100\/50 p-2 md:p-8 flex items-center justify-center overflow-hidden">
          <div 
            className="rounded-2xl md:rounded-[40px] overflow-hidden shadow-2xl border border-zinc-200 relative bg-white flex items-center justify-center w-full h-full"
          >
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="absolute inset-0 w-full h-full cursor-crosshair touch-none z-10"
            />

            {/* Copying Layer (临摹) */}
            <AnimatePresence>
              {selectedInspiration && showTrace && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.15 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
                >
                  <img 
                    src={getInspirationImageUrl(selectedInspiration)}
                    className="h-[80%] aspect-square object-contain"
                    alt="临摹底图"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Selected Inspiration Reference */}
            <AnimatePresence>
              {selectedInspiration && (
                <motion.div
                  initial={{ opacity: 0, x: -20, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20, scale: 0.8 }}
                  className="absolute top-6 left-6 z-20 group"
                >
                  <div className="relative">
                    <div className="w-28 h-28 md:w-40 md:h-40 rounded-xl overflow-hidden shadow-2xl bg-white relative">
                      <img 
                        src={getInspirationImageUrl(selectedInspiration)}
                        className="absolute inset-0 w-full h-full object-contain bg-white"
                        alt="参考图片"
                      />
                    </div>
                    <button
                      type="button"
                      aria-label="关闭参考图"
                      onClick={() => setSelectedInspiration(null)}
                      className={cn(
                        'absolute -top-3 -right-3 z-30 w-10 h-10 bg-red-500/90 backdrop-blur-md text-[#ffffff] rounded-full flex items-center justify-center shadow-lg transition-all hover:bg-red-600 active:scale-90 border border-white/20',
                        touchOrHoverOverlay
                      )}
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-bold text-zinc-900 whitespace-nowrap border border-zinc-200 shadow-xl">
                      参考图片
                    </div>

                    {/* Copy Toggle Button */}
                    <button
                      onClick={() => setShowTrace(!showTrace)}
                      className={cn(
                        "absolute -bottom-12 left-0 w-full py-2 rounded-full text-[11px] font-bold transition-all shadow-xl border whitespace-nowrap",
                        showTrace ? "bg-dino-green text-black border-dino-green" : "bg-zinc-100 text-zinc-900 border-zinc-200"
                      )}
                    >
                      {showTrace ? "隐藏临摹" : "打开临摹"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI Results Overlay */}
            <AnimatePresence>
              {aiResults.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white/90 backdrop-blur-2xl flex flex-col items-center justify-center p-8 z-50 overflow-y-auto"
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="max-w-6xl w-full"
                  >
                    <div className="text-center mb-12">
                      <h3 className="text-4xl font-display font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-dino-green to-emerald-400">迪诺帮你变魔术啦！</h3>
                      <p className="text-zinc-500 text-lg">选一个你最喜欢的魔法效果吧</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {aiResults.map((img, i) => (
                        <motion.div 
                          key={i} 
                          whileHover={{ y: -10 }}
                          className="relative group flex flex-col"
                        >
                          <div className="relative overflow-hidden rounded-[32px] border-4 border-zinc-200 [@media(hover:hover)_and_(pointer:fine)]:group-hover:border-dino-green/50 transition-all shadow-2xl">
                            <img src={img} className="w-full aspect-square object-cover" />
                            <div
                              className={cn(
                                'absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[2px]',
                                touchOrHoverOverlay
                              )}
                            >
                              <button 
                                type="button"
                                onClick={() => selectAiResult(img)}
                                className={cn(
                                  'bg-white text-black px-8 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-2xl',
                                  'scale-100 [@media(hover:hover)_and_(pointer:fine)]:scale-90 [@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-100 transition-transform'
                                )}
                              >
                                <Check className="w-6 h-6" /> 选这个
                              </button>
                            </div>
                            
                            <div className="absolute top-6 left-6 px-4 py-2 bg-white/60 backdrop-blur-md rounded-full text-xs font-bold text-zinc-900 border border-zinc-200 uppercase tracking-widest">
                              {i === 0 ? "轻微优化" : i === 1 ? "创意增强" : "完美蜕变"}
                            </div>
                          </div>
                          <div className="mt-6 text-center">
                            <p className="text-lg font-medium text-zinc-700">
                              {i === 0 ? "保留你的原汁原味" : i === 1 ? "让画作更丰富" : "变成超级大作"}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    
                    <div className="flex justify-center mt-16">
                      <button 
                        onClick={() => setAiResults([])}
                        className="px-10 py-4 rounded-2xl bg-white text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-all flex items-center gap-3 border border-zinc-200"
                      >
                        <X className="w-6 h-6" /> 还是画我自己的
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Processing State */}
            {(isProcessing || aiError) && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-xl flex flex-col items-center justify-center z-40">
                {isProcessing ? (
                  <>
                    <div className="w-32 h-32 relative mb-8">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border-4 border-dino-green border-t-transparent rounded-full"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Wand2 className="w-12 h-12 text-dino-green animate-pulse" />
                      </div>
                    </div>
                    <h4 className="text-2xl font-display font-bold mb-2">魔法正在发生...</h4>
                    <p className="text-zinc-500 animate-pulse">迪诺正在为你精心准备惊喜</p>
                  </>
                ) : (
                  <div className="max-w-lg w-full px-6">
                    <div className="bg-white/90 border border-zinc-200 rounded-3xl p-6 shadow-2xl text-center">
                      <h4 className="text-xl font-display font-bold mb-3">没有变出来</h4>
                      <p className="text-zinc-600 text-sm mb-5 break-words">{aiError}</p>
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => setAiError(null)}
                          className="px-6 py-3 rounded-2xl bg-white text-zinc-700 hover:bg-zinc-100 transition-all border border-zinc-200 font-bold"
                        >
                          知道了
                        </button>
                        <button
                          onClick={() => {
                            setAiError(null);
                            handleMagic();
                          }}
                          className="px-6 py-3 rounded-2xl bg-dino-green text-black hover:opacity-90 transition-all border border-dino-green font-black"
                        >
                          重试
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Floating AI Trigger */}
          {hasAI && (
            <IPCharacter onClick={handleMagic} disabled={isProcessing} />
          )}

          {/* Inspiration Trigger */}
          {hasInspiration && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleInspiration}
              className="absolute bottom-10 left-10 p-7 rounded-full bg-white backdrop-blur-xl border border-zinc-200 text-zinc-900 hover:bg-zinc-100 transition-all shadow-2xl z-30"
            >
              <Lightbulb className="w-8 h-8" />
            </motion.button>
          )}
        </div>
      </main>

      {/* Inspiration Modal */}
      <AnimatePresence>
        {showInspiration && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/80 backdrop-blur-xl z-[60] flex items-end sm:items-center justify-center p-4 touch-manipulation"
            onPointerDown={(e) => {
              if (e.target === e.currentTarget) setShowInspiration(false);
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowInspiration(false);
            }}
          >
            <motion.div 
              initial={{ y: 100, scale: 0.9 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 100, scale: 0.9 }}
              className="bg-white/90 backdrop-blur-2xl border border-zinc-200 w-full max-w-2xl max-h-[min(900px,90vh)] rounded-[48px] p-6 sm:p-10 shadow-3xl flex flex-col overflow-hidden"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 shrink-0 mb-6">
                <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-dino-green/20 rounded-3xl flex items-center justify-center border border-dino-green/20 shrink-0">
                    <Lightbulb className="w-8 h-8 sm:w-10 sm:h-10 text-dino-green" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-2xl sm:text-3xl font-display font-bold">灵感小锦囊</h3>
                    <p className="text-sm sm:text-base text-zinc-500">不知道画什么？迪诺有主意！</p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="关闭"
                  onClick={() => setShowInspiration(false)}
                  className="shrink-0 p-3 sm:p-4 rounded-2xl bg-zinc-100 text-zinc-800 hover:bg-zinc-200 transition-colors border border-zinc-200 shadow-sm"
                >
                  <X className="w-6 h-6 sm:w-7 sm:h-7" />
                </button>
              </div>

              <div className="overflow-y-auto min-h-0 flex-1 overscroll-contain">
                <div className="grid grid-cols-3 gap-3 sm:gap-6 pb-2">
                  {inspirations.length > 0 && !isInspirationLoading ? inspirations.map((idea, i) => (
                    <motion.button
                      key={i}
                      type="button"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      onClick={() => {
                         setSelectedInspiration(idea);
                         setShowTrace(true);
                         setShowInspiration(false);
                      }}
                      className="relative aspect-square rounded-xl overflow-hidden bg-white hover:ring-2 hover:ring-dino-green/50 transition-all group shadow-xl"
                    >
                      <img 
                        src={getInspirationImageUrl(idea)}
                        className="absolute inset-0 w-full h-full object-contain bg-white [@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-110 transition-transform duration-500"
                        alt="灵感图片"
                      />
                    </motion.button>
                  )) : (
                    <div className="col-span-3 py-16 sm:py-20 text-center text-zinc-500 flex flex-col items-center gap-6">
                      <div className="w-16 h-16 border-4 border-dino-green border-t-transparent rounded-full animate-spin" />
                      <p className="text-lg font-medium">正在寻找好主意...</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 shrink-0 pt-6 mt-2 border-t border-zinc-100">
                <button 
                  type="button"
                  onClick={() => setShowInspiration(false)}
                  className="w-full sm:w-auto px-8 py-4 rounded-[24px] bg-white text-zinc-600 font-bold hover:bg-zinc-100 transition-all border border-zinc-200"
                >
                  关闭
                </button>
                <motion.button 
                  type="button"
                  onClick={refreshInspirations}
                  disabled={isInspirationLoading}
                  animate={{ 
                    boxShadow: ["0 0 0px rgba(74, 222, 128, 0)", "0 0 30px rgba(74, 222, 128, 0.3)", "0 0 0px rgba(74, 222, 128, 0)"],
                    scale: [1, 1.02, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex-1 py-4 sm:py-5 rounded-[24px] bg-dino-green text-black font-black text-base sm:text-lg flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-dino-green/20"
                >
                  <RotateCcw className={cn("w-6 h-6", isInspirationLoading && "animate-spin")} />
                  换一批主意
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BadgePopup badge={testBadge} onClose={() => setTestBadge(null)} />
    </div>
  );
};
