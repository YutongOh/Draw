import React, { useState, useEffect } from 'react';
import { AgeSelection } from './components/AgeSelection';
import { DrawingBoard } from './components/DrawingBoard';
import { Gallery } from './components/Gallery';
import { PrintFeedback } from './components/PrintFeedback';
import { MoviePlayer } from './components/MoviePlayer';
import { ParentDashboard } from './components/ParentDashboard';
import { AppState, AgeGroup, Drawing } from './types';
import { PRESET_DRAWINGS } from './constants/presets';

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('dinodraw_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.history || parsed.history.length === 0) {
          parsed.history = PRESET_DRAWINGS;
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
