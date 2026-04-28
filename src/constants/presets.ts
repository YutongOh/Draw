import { Drawing } from '../types';

const now = Date.now();
const dayMs = 24 * 60 * 60 * 1000;

export const PRESET_DRAWINGS: Drawing[] = [
  {
    id: 'preset-1',
    timestamp: now - 1 * dayMs,
    originalImage: '/inspirations/inspiration-01.png',
    refinedImage: '/inspirations/inspiration-01.png',
    prompt: '一幅充满想象力的儿童画'
  },
  {
    id: 'preset-2',
    timestamp: now - 2 * dayMs,
    originalImage: '/inspirations/inspiration-05.png',
    refinedImage: '/inspirations/inspiration-05.png',
    prompt: '一幅充满想象力的儿童画'
  },
  {
    id: 'preset-3',
    timestamp: now - 3 * dayMs,
    originalImage: '/inspirations/inspiration-10.png',
    refinedImage: '/inspirations/inspiration-10.png',
    prompt: '一幅充满想象力的儿童画'
  },
  {
    id: 'preset-4',
    timestamp: now - 4 * dayMs,
    originalImage: '/inspirations/inspiration-15.png',
    refinedImage: '/inspirations/inspiration-15.png',
    prompt: '一幅充满想象力的儿童画'
  },
  {
    id: 'preset-5',
    timestamp: now - 5 * dayMs,
    originalImage: '/inspirations/inspiration-20.png',
    refinedImage: '/inspirations/inspiration-20.png',
    prompt: '一幅充满想象力的儿童画'
  },
  {
    id: 'preset-6',
    timestamp: now - 6 * dayMs,
    originalImage: '/inspirations/inspiration-25.png',
    refinedImage: '/inspirations/inspiration-25.png',
    prompt: '一幅充满想象力的儿童画'
  }
];
