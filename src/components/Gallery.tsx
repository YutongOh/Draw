import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ChevronLeft, 
  Trash2, 
  Printer, 
  CheckCircle2, 
  Circle,
  Library,
  Film,
  Calendar,
  Edit2
} from 'lucide-react';
import { Drawing } from '../types';
import { cn } from '../lib/utils';

interface GalleryProps {
  drawings: Drawing[];
  onBack: () => void;
  onPrint: (drawing: Drawing) => void;
  onDelete: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onGenerateMovie: (drawings: Drawing[]) => void;
  onEdit: (drawing: Drawing) => void;
}

export const Gallery: React.FC<GalleryProps> = ({ 
  drawings, 
  onBack, 
  onPrint, 
  onDelete,
  onBulkDelete,
  onGenerateMovie,
  onEdit
}) => {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleMovieClick = () => {
    if (selectedIds.length === 0) return;
    const selectedDrawings = drawings.filter(d => selectedIds.includes(d.id));
    onGenerateMovie(selectedDrawings);
  };

  const handleBulkDeleteClick = () => {
    if (selectedIds.length === 0) return;
    onBulkDelete(selectedIds);
    setSelectedIds([]);
    setIsSelectionMode(false);
  };

  return (
    <div className="h-screen h-[100dvh] flex flex-col bg-zinc-50 overflow-hidden transition-colors duration-500">
      <header className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-6 border-b border-zinc-200 bg-white backdrop-blur-2xl z-20 transition-colors duration-500">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <button 
            onClick={onBack}
            className="p-3 rounded-2xl glass-button"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-dino-green/20 rounded-2xl flex items-center justify-center border border-dino-green/20">
              <Library className="w-6 h-6 text-dino-green" />
            </div>
            <div>
              <h2 className="font-display font-bold text-2xl tracking-tight">作品宝库</h2>
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">共 {drawings.length} 件艺术品</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 w-full sm:w-auto">
          <button 
            onClick={() => {
              setIsSelectionMode(!isSelectionMode);
              setSelectedIds([]);
            }}
            className={cn(
              "px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl font-bold transition-all border text-sm sm:text-base",
              isSelectionMode 
                ? "bg-white text-black border-white" 
                : "glass-button"
            )}
          >
            {isSelectionMode ? "取消选择" : "批量管理"}
          </button>
          
          {isSelectionMode && selectedIds.length > 0 && (
            <>
              <motion.button 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={handleMovieClick}
                className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-dino-green text-black font-black shadow-xl shadow-dino-green/20 hover:scale-105 transition-all active:scale-95 text-sm sm:text-base"
              >
                <Film className="w-5 h-5 shrink-0" />
                生成影集 ({selectedIds.length})
              </motion.button>
              <motion.button 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={handleBulkDeleteClick}
                className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-red-500 text-white font-black shadow-xl hover:scale-105 transition-all active:scale-95 text-sm sm:text-base"
              >
                <Trash2 className="w-5 h-5 shrink-0" />
                删除所选 ({selectedIds.length})
              </motion.button>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 p-8 overflow-y-auto select-none">
        <div className="max-w-[1600px] mx-auto w-full h-full">
        {drawings.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-600">
            <motion.div 
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-40 h-40 mb-8 opacity-20"
            >
              <Library className="w-full h-full" />
            </motion.div>
            <p className="text-2xl font-medium">这里还是空空的，快去画画吧！</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8">
            {drawings.map((drawing, index) => (
              <motion.div
                key={drawing.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "group relative aspect-[4/3] rounded-[32px] overflow-hidden border-2 transition-all cursor-pointer",
                  selectedIds.includes(drawing.id) ? "border-dino-green ring-4 ring-dino-green/20" : "border-zinc-200 hover:border-white/20"
                )}
                onClick={() => {
                  if (isSelectionMode) toggleSelection(drawing.id);
                }}
              >
                <img 
                  src={drawing.refinedImage || drawing.originalImage} 
                  className="w-full h-full object-cover [@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-110 transition-transform duration-500"
                  alt="Artwork"
                />
                
                {/* Selection Overlay */}
                {isSelectionMode && (
                  <div className="absolute top-4 right-4 z-10">
                    {selectedIds.includes(drawing.id) ? (
                      <CheckCircle2 className="w-8 h-8 text-dino-green fill-black" />
                    ) : (
                      <Circle className="w-8 h-8 text-zinc-500" />
                    )}
                  </div>
                )}

                {/* Desktop: hover actions */}
                {!isSelectionMode && (
                  <div
                    className={cn(
                      'absolute inset-0 bg-white/60 backdrop-blur-[2px] transition-opacity items-center justify-center gap-3 sm:gap-4 pointer-events-auto',
                      'hidden [@media(hover:hover)_and_(pointer:fine)]:flex opacity-0 group-hover:opacity-100'
                    )}
                  >
                    <button 
                      onClick={(e) => { e.stopPropagation(); onEdit(drawing); }}
                      className="p-4 rounded-2xl bg-dino-green text-black hover:scale-110 transition-transform shadow-xl"
                      title="二次创作"
                    >
                      <Edit2 className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onPrint(drawing); }}
                      className="p-4 rounded-2xl bg-white text-black hover:scale-110 transition-transform shadow-xl"
                      title="打印"
                    >
                      <Printer className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(drawing.id); }}
                      className="p-4 rounded-2xl bg-red-500 text-[#ffffff] hover:scale-110 transition-transform shadow-xl"
                      title="删除"
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>
                  </div>
                )}

                {/* Tablet / touch: always-visible action strip */}
                {!isSelectionMode && (
                  <div
                    className={cn(
                      'absolute left-2 right-2 bottom-12 z-[25] flex justify-center gap-2 [@media(hover:hover)_and_(pointer:fine)]:hidden'
                    )}
                  >
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onEdit(drawing); }}
                      className="p-3 rounded-xl bg-dino-green text-black shadow-lg active:scale-95 transition-transform"
                      title="二次创作"
                      aria-label="二次创作"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onPrint(drawing); }}
                      className="p-3 rounded-xl bg-white text-black shadow-lg active:scale-95 transition-transform"
                      title="打印"
                      aria-label="打印"
                    >
                      <Printer className="w-5 h-5" />
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onDelete(drawing.id); }}
                      className="p-3 rounded-xl bg-red-500 text-white shadow-lg active:scale-95 transition-transform"
                      title="删除"
                      aria-label="删除"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#000000]/80 to-transparent">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-[#ffffff] uppercase tracking-widest">
                    <Calendar className="w-3 h-3" />
                    {new Date(drawing.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        </div>
      </main>
    </div>
  );
};
