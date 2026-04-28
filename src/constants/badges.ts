export interface BadgeStats {
  totalDrawings: number;
  totalFocusTime: number;
  aiUsedCount: number;
  activeDays: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  message: string;
  isEarned: (stats: BadgeStats) => boolean;
}

const baseUrl = import.meta.env.BASE_URL;
const badgeIcon = (filename: string) => `${baseUrl}badges/${filename}`;

export const BADGES: Badge[] = [
  {
    id: 'first-drawing',
    name: '初次挥毫',
    description: '完成第一幅画作',
    icon: badgeIcon('drawings-1.png'),
    message: '太棒了！你迈出了成为小画家的第一步！',
    isEarned: (stats) => stats.totalDrawings >= 1,
  },
  {
    id: 'drawing-7',
    name: '七彩画笔',
    description: '完成7幅画作',
    icon: badgeIcon('drawings-7.png'),
    message: '坚持不懈！你的画技越来越棒了！',
    isEarned: (stats) => stats.totalDrawings >= 7,
  },
  {
    id: 'drawing-14',
    name: '画作达人',
    description: '完成14幅画作',
    icon: badgeIcon('drawings-14.png'),
    message: '太厉害了！你已经创作了这么多作品！',
    isEarned: (stats) => stats.totalDrawings >= 14,
  },
  {
    id: 'drawing-21',
    name: '绘画大师',
    description: '完成21幅画作',
    icon: badgeIcon('drawings-21.png'),
    message: '不可思议！你就是未来的大艺术家！',
    isEarned: (stats) => stats.totalDrawings >= 21,
  },
  {
    id: 'focus-15',
    name: '小专注',
    description: '累计专注绘画超过15分钟',
    icon: badgeIcon('focus-15.png'),
    message: '专注力很棒！继续保持哦！',
    isEarned: (stats) => stats.totalFocusTime >= 15,
  },
  {
    id: 'focus-30',
    name: '专注达人',
    description: '累计专注绘画超过30分钟',
    icon: badgeIcon('focus-30.png'),
    message: '太棒了！你沉浸在艺术世界里的样子真好看！',
    isEarned: (stats) => stats.totalFocusTime >= 30,
  },
  {
    id: 'focus-45',
    name: '专注大师',
    description: '累计专注绘画超过45分钟',
    icon: badgeIcon('focus-45.png'),
    message: '惊人的专注力！你的耐心会带来很棒的作品！',
    isEarned: (stats) => stats.totalFocusTime >= 45,
  },
  {
    id: 'focus-60',
    name: '专注王者',
    description: '累计专注绘画超过60分钟',
    icon: badgeIcon('focus-60.png'),
    message: '不可思议！你已经完全沉浸在创作中了！',
    isEarned: (stats) => stats.totalFocusTime >= 60,
  },
  {
    id: 'ai-1',
    name: '初识AI',
    description: '使用AI辅助绘画1次',
    icon: badgeIcon('ai-1.png'),
    message: '善用科技！你和AI成为了好搭档！',
    isEarned: (stats) => stats.aiUsedCount >= 1,
  },
  {
    id: 'ai-7',
    name: 'AI好伙伴',
    description: '使用AI辅助绘画7次',
    icon: badgeIcon('ai-7.png'),
    message: '越来越熟练了！AI是你的好帮手！',
    isEarned: (stats) => stats.aiUsedCount >= 7,
  },
  {
    id: 'ai-21',
    name: 'AI探索家',
    description: '使用AI辅助绘画21次',
    icon: badgeIcon('ai-21.png'),
    message: '太厉害了！你已经能和AI完美配合了！',
    isEarned: (stats) => stats.aiUsedCount >= 21,
  },
  {
    id: 'activity-3',
    name: '活跃宝宝',
    description: '累计活跃3天',
    icon: badgeIcon('activity-3.png'),
    message: '每天都在进步！保持这份热爱吧！',
    isEarned: (stats) => stats.activeDays >= 3,
  },
  {
    id: 'activity-7',
    name: '全勤宝宝',
    description: '累计活跃7天',
    icon: badgeIcon('activity-7.png'),
    message: '坚持了一周！为你点赞！',
    isEarned: (stats) => stats.activeDays >= 7,
  },
  {
    id: 'activity-14',
    name: '活跃达人',
    description: '累计活跃14天',
    icon: badgeIcon('activity-14.png'),
    message: '两周的坚持！你的毅力真让人佩服！',
    isEarned: (stats) => stats.activeDays >= 14,
  },
  {
    id: 'activity-21',
    name: '活跃王者',
    description: '累计活跃21天',
    icon: badgeIcon('activity-21.png'),
    message: '三周的陪伴！绘画已经成为你的好习惯！',
    isEarned: (stats) => stats.activeDays >= 21,
  }
];
