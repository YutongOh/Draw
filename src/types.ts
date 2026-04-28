export type AgeGroup = '2-4' | '4-7';

export interface Drawing {
  id: string;
  timestamp: number;
  originalImage: string; // base64
  refinedImage?: string; // base64
  prompt?: string;
}

export interface AppState {
  view: 'age-selection' | 'drawing' | 'gallery' | 'printing' | 'parent-dashboard';
  ageGroup: AgeGroup | null;
  history: Drawing[];
  currentDrawing?: Drawing | null;
}
