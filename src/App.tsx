import React, { useState, useEffect } from 'react';
import { AgeSelection } from './components/AgeSelection';
import { DrawingBoard } from './components/DrawingBoard';
import { Gallery } from './components/Gallery';
import { PrintFeedback } from './components/PrintFeedback';
import { MoviePlayer } from './components/MoviePlayer';
import { ParentDashboard } from './components/ParentDashboard';
import { AppState, AgeGroup, Drawing } from './types';
import { PRESET_DRAWINGS } from './constants/presets';

function migrateAssetUrl(url: unknown): string | undefined {
  if (typeof url !== 'string') return undefined;
  let s = url;
  if (s.startsWith('data:') || /^https?:\/\//i.test(s) || s.startsWith('//'))
    return s;

  let baseUrl = String(import.meta.env.BASE_URL ?? '/');
  if (!baseUrl.endsWith('/')) baseUrl = `${baseUrl}/`;
  const trimmedBase = baseUrl.replace(/\/+$/, '');

  // Bugfix: URLs already rooted at BASE_URL (e.g. /Draw/inspirations/...) must not get base prepended twice.
  if (trimmedBase && (s === trimmedBase || s.startsWith(`${trimmedBase}/`))) return s;

  const dup = `${trimmedBase}/${trimmedBase.replace(/^\//, '')}/`;
  if (s.startsWith(dup)) {
    s = `${baseUrl}${s.slice(dup.length)}`;
  }

  // Site-root legacy paths /inspirations/... → under GitHub Pages subpath BASE_URL.
  if (s.startsWith('/')) return `${baseUrl}${s.replace(/^\/+/, '')}`;
  return s;
}

function migrateDrawing(d: unknown): Drawing | null {
  if (!d || typeof d !== 'object') return null;
  const anyD = d as Partial<Drawing>;
  if (typeof anyD.id !== 'string' || typeof anyD.timestamp !== 'number') return null;
  const originalImage = migrateAssetUrl(anyD.originalImage) ?? anyD.originalImage;
  if (typeof originalImage !== 'string') return null;
  const refinedImage = migrateAssetUrl(anyD.refinedImage) ?? anyD.refinedImage;
  return {
    id: anyD.id,
    timestamp: anyD.timestamp,
    originalImage,
    refinedImage: typeof refinedImage === 'string' ? refinedImage : undefined,
    prompt: typeof anyD.prompt === 'string' ? anyD.prompt : undefined,
  };
}

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('dinodraw_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Only backfill presets when history is missing (legacy saves). Empty array means the user cleared the gallery.
        if (!Array.isArray(parsed.history)) parsed.history = [...PRESET_DRAWINGS];

        // Migrate any legacy absolute public-asset URLs (e.g. "/inspirations/...") to BASE_URL-prefixed paths
        if (Array.isArray(parsed.history)) {
          parsed.history = parsed.history
            .map(migrateDrawing)
            .filter(Boolean);
        }
        if (parsed.currentDrawing) {
          parsed.currentDrawing = migrateDrawing(parsed.currentDrawing);
        }

        return { ...parsed, view: 'age-selection', ageGroup: null };
      } catch (e) {
        console.error("Failed to load state", e);
      }
    }
    return {
      view: 'age-selection',
      ageGroup: null,
      history: PRESET_DRAWINGS
    };
  });

  const [currentPrint, setCurrentPrint] = useState<Drawing | null>(null);
  const [isMoviePlaying, setIsMoviePlaying] = useState(false);
  const [movieDrawings, setMovieDrawings] = useState<Drawing[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('dinodraw_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    localStorage.setItem('dinodraw_state', JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    localStorage.setItem('dinodraw_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleAgeSelect = (age: AgeGroup) => {
    setState(prev => ({ ...prev, ageGroup: age, view: 'drawing' }));
  };

  const handleSave = (drawing: Drawing) => {
    setState(prev => ({
      ...prev,
      history: [drawing, ...prev.history]
    }));
  };

  const handleDelete = (id: string) => {
    setState(prev => ({
      ...prev,
      history: prev.history.filter(d => d.id !== id)
    }));
  };

  const handleBulkDelete = (ids: string[]) => {
    const idSet = new Set(ids);
    setState(prev => ({
      ...prev,
      history: prev.history.filter(d => !idSet.has(d.id))
    }));
  };

  const handlePrint = (drawing: Drawing) => {
    setCurrentPrint(drawing);
    setState(prev => ({ ...prev, view: 'printing' }));
  };

  const handleGenerateMovie = (drawings: Drawing[]) => {
    setMovieDrawings(drawings);
    setIsMoviePlaying(true);
  };

  return (
    <div className="w-screen h-screen h-[100dvh] bg-zinc-100 flex items-center justify-center overflow-hidden">
      <div 
        className={`relative bg-zinc-50 text-zinc-900 overflow-hidden w-full h-full ${state.view !== 'age-selection' && theme === 'dark' ? 'dark' : ''}`}
      >
        {state.view === 'age-selection' && (
        <AgeSelection 
          onSelect={handleAgeSelect} 
          onGallery={() => setState(prev => ({ ...prev, view: 'gallery' }))}
          onParentMode={() => setState(prev => ({ ...prev, view: 'parent-dashboard' }))}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      {state.view === 'parent-dashboard' && (
        <ParentDashboard
          history={state.history}
          onBack={() => setState(prev => ({ ...prev, view: 'age-selection' }))}
        />
      )}

      {state.view === 'drawing' && state.ageGroup && (
        <DrawingBoard 
          ageGroup={state.ageGroup}
          initialDrawing={state.currentDrawing}
          onBack={() => setState(prev => ({ ...prev, view: 'age-selection', ageGroup: null, currentDrawing: null }))}
          onGallery={() => setState(prev => ({ ...prev, view: 'gallery' }))}
          onSave={handleSave}
          onPrint={handlePrint}
        />
      )}

      {state.view === 'gallery' && (
        <Gallery 
          drawings={state.history}
          onBack={() => setState(prev => ({ 
            ...prev, 
            view: prev.ageGroup ? 'drawing' : 'age-selection' 
          }))}
          onDelete={handleDelete}
          onBulkDelete={handleBulkDelete}
          onPrint={handlePrint}
          onGenerateMovie={handleGenerateMovie}
          onEdit={(drawing) => setState(prev => ({
            ...prev,
            view: 'drawing',
            ageGroup: prev.ageGroup || '4-7', // Default to 4-7 if not set
            currentDrawing: drawing
          }))}
        />
      )}

      {state.view === 'printing' && currentPrint && (
        <PrintFeedback 
          drawing={currentPrint}
          onClose={() => setState(prev => ({ 
            ...prev, 
            view: prev.ageGroup ? 'drawing' : 'gallery' 
          }))}
        />
      )}

      {isMoviePlaying && (
        <MoviePlayer 
          drawings={movieDrawings}
          onClose={() => {
            setIsMoviePlaying(false);
            setMovieDrawings([]);
          }}
        />
      )}
      </div>
    </div>
  );
}
