import { Drawing } from '../types';

const now = Date.now();
const dayMs = 24 * 60 * 60 * 1000;
const baseUrl = import.meta.env.BASE_URL;
const inspirationUrl = (n: number) =>
  `${baseUrl}inspirations/inspiration-${n.toString().padStart(2, '0')}.png`;

export const PRESET_DRAWINGS: Drawing[] = [
  {
    id: 'preset-1',
    timestamp: now - 1 * dayMs,
    originalImage: inspirationUrl(2),
    refinedImage: inspirationUrl(2),
    prompt: '一幅充满想象力的儿童画'
  },
  {
    id: 'preset-2',
    timestamp: now - 2 * dayMs,
    originalImage: inspirationUrl(5),
    refinedImage: inspirationUrl(5),
    prompt: '一幅充满想象力的儿童画'
  },
  {
    id: 'preset-3',
    timestamp: now - 3 * dayMs,
    originalImage: inspirationUrl(10),
    refinedImage: inspirationUrl(10),
    prompt: '一幅充满想象力的儿童画'
  },
  {
    id: 'preset-4',
    timestamp: now - 4 * dayMs,
    originalImage: inspirationUrl(15),
    refinedImage: inspirationUrl(15),
    prompt: '一幅充满想象力的儿童画'
  },
  {
    id: 'preset-5',
    timestamp: now - 5 * dayMs,
    originalImage: inspirationUrl(20),
    refinedImage: inspirationUrl(20),
    prompt: '一幅充满想象力的儿童画'
  },
  {
    id: 'preset-6',
    timestamp: now - 6 * dayMs,
    originalImage: inspirationUrl(26),
    refinedImage: inspirationUrl(26),
    prompt: '一幅充满想象力的儿童画'
  },
  {
    id: 'preset-7',
    timestamp: now - 7 * dayMs,
    originalImage: inspirationUrl(3),
    refinedImage: inspirationUrl(3),
    prompt: '一幅充满想象力的儿童画'
  },
  {
    id: 'preset-8',
    timestamp: now - 8 * dayMs,
    originalImage: inspirationUrl(12),
    refinedImage: inspirationUrl(12),
    prompt: '一幅充满想象力的儿童画'
  }
];
