export interface InspirationItem {
  id: number;
  title: string;
}

const baseUrl = import.meta.env.BASE_URL;
export const INSPIRATION_SPRITE_URL = `${baseUrl}inspirations/sprite.png`; // Not really used if we use individual images

export const PRESET_INSPIRATIONS: InspirationItem[] = [
  { id: 2, title: '小猫' },
  { id: 3, title: '小狗' },
  { id: 4, title: '小鸟' },
  { id: 5, title: '大树' },
  { id: 6, title: '花朵' },
  { id: 9, title: '汽车' },
  { id: 10, title: '飞机' },
  { id: 11, title: '火箭' },
  { id: 12, title: '房子' },
  { id: 13, title: '太阳' },
  { id: 14, title: '月亮' },
  { id: 15, title: '星星' },
  { id: 16, title: '云朵' },
  { id: 17, title: '彩虹' },
  { id: 18, title: '气球' },
  { id: 19, title: '冰淇淋' },
  { id: 20, title: '蛋糕' },
  { id: 21, title: '苹果' },
  { id: 22, title: '香蕉' },
  { id: 23, title: '西瓜' },
  { id: 26, title: '鱼' },
  { id: 27, title: '蝴蝶' },
  { id: 29, title: '蜜蜂' },
  { id: 33, title: '小熊' }
];

/** 与灵感锦囊网格使用同一 PNG 路径（`/BASE/inspirations/inspiration-XX.png`）。 */
export function getInspirationImageUrl(item: Pick<InspirationItem, 'id'> | number): string {
  const id = typeof item === 'number' ? item : item.id;
  return `${baseUrl}inspirations/inspiration-${id.toString().padStart(2, '0')}.png`;
}

/** 作品库初始示例用的前 6 条锦囊素材（与列表顺序一致）。 */
export const GALLERY_SEED_INSPIRATIONS = PRESET_INSPIRATIONS.slice(0, 6);
