import { Drawing } from '../types';
import { GALLERY_SEED_INSPIRATIONS, getInspirationImageUrl } from './inspirations';

const now = Date.now();
const dayMs = 24 * 60 * 60 * 1000;

/**
 * 作品库初始示例：直接复用「灵感锦囊」前 6 条素材（与锦囊同源 PNG）。
 */
export const PRESET_DRAWINGS: Drawing[] = GALLERY_SEED_INSPIRATIONS.map((item, i) => {
  const src = getInspirationImageUrl(item);
  return {
    id: `preset-insp-${item.id}`,
    timestamp: now - (i + 1) * dayMs,
    originalImage: src,
    refinedImage: src,
    prompt: `灵感主题：${item.title}`,
  };
});
