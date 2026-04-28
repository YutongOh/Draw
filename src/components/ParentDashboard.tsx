import React, { useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  BarChart3, 
  Clock, 
  Image as ImageIcon, 
  Activity,
  Sparkles,
  Calendar,
  ArrowRight,
  Palette,
  BrainCircuit,
  TrendingUp,
  Award
} from 'lucide-react';
import { Drawing } from '../types';
import { BADGES, Badge } from '../constants/badges';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area,
  Legend
} from 'recharts';

interface ParentDashboardProps {
  history: Drawing[];
  onBack: () => void;
}

type PanelType = 'overview' | 'badges' | 'history' | 'analysis' | 'total-drawings' | 'focus-time' | 'ai-usage' | 'activity';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const PIE_COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa'];

export const ParentDashboard: React.FC<ParentDashboardProps> = ({ history, onBack }) => {
  const [activePanel, setActivePanel] = useState<PanelType>('overview');
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [testAllBadges, setTestAllBadges] = useState(false);
  const [touchStart, setTouchStart] = useState<{x: number, y: number} | null>(null);
  const [touchEnd, setTouchEnd] = useState<{x: number, y: number} | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDirectionalNav = (direction: 'next' | 'prev') => {
    if (isNavigating) return;

    const mainPanels: PanelType[] = ['overview', 'badges', 'history', 'analysis'];
    const metricPanels: PanelType[] = ['total-drawings', 'focus-time', 'ai-usage', 'activity'];

    let changed = false;

    if (mainPanels.includes(activePanel)) {
      const currentIndex = mainPanels.indexOf(activePanel);
      if (direction === 'next' && currentIndex < mainPanels.length - 1) {
        setActivePanel(mainPanels[currentIndex + 1]);
        changed = true;
      } else if (direction === 'prev' && currentIndex > 0) {
        setActivePanel(mainPanels[currentIndex - 1]);
        changed = true;
      }
    } else if (metricPanels.includes(activePanel)) {
      const currentIndex = metricPanels.indexOf(activePanel);
      if (direction === 'next' && currentIndex < metricPanels.length - 1) {
        setActivePanel(metricPanels[currentIndex + 1]);
        changed = true;
      } else if (direction === 'prev') {
        if (currentIndex > 0) {
          setActivePanel(metricPanels[currentIndex - 1]);
        } else {
          setActivePanel('overview');
        }
        changed = true;
      }
    }

    if (changed) {
      setIsNavigating(true);
      setTimeout(() => setIsNavigating(false), 800);
      if (containerRef.current) {
        containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || isNavigating) return;
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    
    if (Math.abs(distanceX) > Math.abs(distanceY) && Math.abs(distanceX) > 50) {
      // Horizontal swipe
      if (distanceX > 0) handleDirectionalNav('next');
      else handleDirectionalNav('prev');
    }
  };

  // --- Data Processing ---
  const totalDrawings = history.length;
  const aiUsedCount = history.filter(d => d.refinedImage).length;
  const aiUsageRate = totalDrawings > 0 ? Math.round((aiUsedCount / totalDrawings) * 100) : 0;
  const totalFocusTime = totalDrawings * 15; // Mock 15 mins per drawing

  const activeDays = useMemo(() => {
    return new Set(history.map(d => new Date(d.timestamp).toDateString())).size;
  }, [history]);

  const stats = useMemo(() => ({
    totalDrawings,
    totalFocusTime,
    aiUsedCount,
    activeDays
  }), [totalDrawings, totalFocusTime, aiUsedCount, activeDays]);

  // Weekly Data
  const weeklyData = useMemo(() => {
    const data = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
      
      const dayDrawings = history.filter(drawing => {
        const drawDate = new Date(drawing.timestamp);
        return drawDate.getDate() === d.getDate() && drawDate.getMonth() === d.getMonth();
      });

      data.push({
        name: dateStr,
        drawings: dayDrawings.length,
        focusTime: dayDrawings.length * 15,
        aiUsed: dayDrawings.filter(d => d.refinedImage).length
      });
    }
    return data;
  }, [history]);

  // Time of Day Distribution
  const timeOfDayData = useMemo(() => {
    let morning = 0, afternoon = 0, evening = 0;
    history.forEach(d => {
      const hour = new Date(d.timestamp).getHours();
      if (hour >= 6 && hour < 12) morning++;
      else if (hour >= 12 && hour < 18) afternoon++;
      else evening++;
    });
    
    const data = [
      { name: '早晨 (6-12点)', value: morning },
      { name: '下午 (12-18点)', value: afternoon },
      { name: '晚上 (18-24点)', value: evening },
    ].filter(d => d.value > 0);
    
    return data.length > 0 ? data : [{ name: '暂无数据', value: 1 }];
  }, [history]);

  // Radar Chart Data (Mocked based on activity)
  const radarData = useMemo(() => {
    return [
      { subject: '色彩运用', A: Math.min(100, 40 + totalDrawings * 5), fullMark: 100 },
      { subject: '创作频率', A: Math.min(100, 20 + totalDrawings * 10), fullMark: 100 },
      { subject: '专注力', A: Math.min(100, 50 + totalDrawings * 2), fullMark: 100 },
      { subject: 'AI互动', A: Math.min(100, aiUsageRate + 20), fullMark: 100 },
      { subject: '想象力', A: Math.min(100, 60 + aiUsedCount * 5), fullMark: 100 },
    ];
  }, [totalDrawings, aiUsageRate, aiUsedCount]);

  // Color Preference Data (Mocked deterministically)
  const colorData = useMemo(() => {
    if (totalDrawings === 0) return [{ name: '暂无数据', value: 1 }];
    return [
      { name: '天空蓝', value: 45 + (totalDrawings % 2) * 15 },
      { name: '自然绿', value: 25 + (totalDrawings % 4) * 5 },
      { name: '热情红', value: 30 + (totalDrawings % 3) * 10 },
      { name: '明亮黄', value: 20 },
      { name: '梦幻紫', value: 15 },
    ];
  }, [totalDrawings]);

  // Cumulative Growth Data
  const cumulativeData = useMemo(() => {
    let acc = 0;
    return weeklyData.map(d => {
      acc += d.drawings;
      return { ...d, cumulative: acc };
    });
  }, [weeklyData]);

  // Use 14 days data for more detailed view
  const extendedData = useMemo(() => {
    const data = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
      
      const dayDrawings = history.filter(drawing => {
        const drawDate = new Date(drawing.timestamp);
        return drawDate.getDate() === d.getDate() && drawDate.getMonth() === d.getMonth();
      });

      data.push({
        name: dateStr,
        drawings: dayDrawings.length,
        focusTime: dayDrawings.length * 15,
        aiUsed: dayDrawings.filter(d => d.refinedImage).length
      });
    }
    return data;
  }, [history]);

  // --- Render Helpers ---
  const renderOverview = () => (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-8"
    >
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          onClick={() => setActivePanel('total-drawings')}
          className="bg-white border border-zinc-200 rounded-3xl p-6 relative overflow-hidden group cursor-pointer hover:bg-zinc-50 transition-colors"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-zinc-500 font-medium">累计创作</h3>
          </div>
          <div className="text-4xl font-bold relative z-10">{totalDrawings} <span className="text-lg text-zinc-500 font-normal">幅</span></div>
        </div>

        <div 
          onClick={() => setActivePanel('focus-time')}
          className="bg-white border border-zinc-200 rounded-3xl p-6 relative overflow-hidden group cursor-pointer hover:bg-zinc-50 transition-colors"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-zinc-500 font-medium">专注时长</h3>
          </div>
          <div className="text-4xl font-bold relative z-10">{totalFocusTime} <span className="text-lg text-zinc-500 font-normal">分钟</span></div>
        </div>

        <div 
          onClick={() => setActivePanel('ai-usage')}
          className="bg-white border border-zinc-200 rounded-3xl p-6 relative overflow-hidden group cursor-pointer hover:bg-zinc-50 transition-colors"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-zinc-500 font-medium">AI 互动率</h3>
          </div>
          <div className="text-4xl font-bold relative z-10">{aiUsageRate}<span className="text-lg text-zinc-500 font-normal">%</span></div>
        </div>
        
        <div 
          onClick={() => setActivePanel('activity')}
          className="bg-white border border-zinc-200 rounded-3xl p-6 relative overflow-hidden group cursor-pointer hover:bg-zinc-50 transition-colors"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center">
              <Activity className="w-6 h-6 text-orange-400" />
            </div>
            <h3 className="text-zinc-500 font-medium">近期活跃度</h3>
          </div>
          <div className="text-4xl font-bold relative z-10">{weeklyData[6].drawings > 0 ? '活跃' : '平静'}</div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-3xl p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              近7日创作趋势
            </h3>
            <button 
              onClick={() => setActivePanel('history')}
              className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              查看作品明细 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-zinc-200)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--color-zinc-500)" axisLine={false} tickLine={false} />
                <YAxis stroke="var(--color-zinc-500)" axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-white)', border: '1px solid var(--color-zinc-200)', borderRadius: '12px', color: 'var(--color-zinc-900)' }}
                  cursor={{ fill: 'rgba(128,128,128,0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="drawings" name="总作品数" fill="#3b82f6" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="aiUsed" name="其中使用AI" fill="#a855f7" radius={[4, 4, 0, 0]} stackId="b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-purple-400" />
              能力雷达图
            </h3>
            <button 
              onClick={() => setActivePanel('analysis')}
              className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
            >
              深度分析 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 min-h-[250px] -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="var(--color-zinc-200)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#aaa', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="能力评估" dataKey="A" stroke="#a855f7" fill="#a855f7" fillOpacity={0.5} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-white)', border: '1px solid var(--color-zinc-200)', borderRadius: '12px', color: 'var(--color-zinc-900)' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time of Day Pie Chart */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 flex flex-col">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            创作时段分布
          </h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={timeOfDayData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {timeOfDayData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-white)', border: '1px solid var(--color-zinc-200)', borderRadius: '12px', color: 'var(--color-zinc-900)' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Color Preference Donut */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 flex flex-col">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Palette className="w-5 h-5 text-orange-400" />
            色彩偏好分析
          </h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={colorData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  stroke="none"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#555' }}
                >
                  {colorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-white)', border: '1px solid var(--color-zinc-200)', borderRadius: '12px', color: 'var(--color-zinc-900)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderBadgesPanel = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="bg-white border border-zinc-200 rounded-3xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" />
              阶段性成就徽章
            </h3>
            <button
              onClick={() => setTestAllBadges(!testAllBadges)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                testAllBadges 
                  ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' 
                  : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
              }`}
            >
              {testAllBadges ? '取消测试' : '测试'}
            </button>
          </div>
          <div className="text-sm text-zinc-500">
            已获得 {testAllBadges ? BADGES.length : BADGES.filter(b => b.isEarned(stats)).length} / {BADGES.length} 枚
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
          {BADGES.map((badge) => {
            const earned = testAllBadges || badge.isEarned(stats);
            return (
              <motion.div 
                key={badge.id} 
                whileHover={earned ? { scale: 1.05 } : {}}
                whileTap={earned ? { scale: 0.95 } : {}}
                onClick={() => earned && setSelectedBadge(badge)}
                className={`flex flex-col items-center p-4 rounded-2xl border transition-all ${
                  earned 
                    ? 'bg-gradient-to-b from-yellow-500/10 to-transparent border-yellow-500/30 cursor-pointer shadow-lg shadow-yellow-500/5' 
                    : 'bg-white border-zinc-100 opacity-50 grayscale cursor-not-allowed'
                }`}
              >
                <div className="w-20 h-20 rounded-full bg-zinc-100 mb-3 flex items-center justify-center overflow-hidden relative">
                  <img 
                    src={badge.icon} 
                    alt={badge.name}
                    className="w-full h-full object-cover z-10"
                    onError={(e) => {
                      // Fallback if image not uploaded yet
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  {/* Fallback Icon */}
                  <Award className={`w-10 h-10 hidden absolute z-0 ${earned ? 'text-yellow-400' : 'text-zinc-500'}`} />
                </div>
                <div className={`text-sm font-bold text-center ${earned ? 'text-yellow-400' : 'text-zinc-500'}`}>
                  {badge.name}
                </div>
                <div className="text-xs text-zinc-500 text-center mt-1">
                  {badge.description}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );

  const renderHistoryPanel = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between bg-white border border-zinc-200 rounded-3xl p-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-400" />
            作品明细记录
          </h2>
          <p className="text-zinc-500 mt-1">查看宝贝每一次的创作详情</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-blue-400">{totalDrawings}</div>
          <div className="text-sm text-zinc-500">总记录数</div>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-20 text-zinc-500 bg-white rounded-3xl border border-zinc-200">
          <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>暂无创作记录，快让宝贝去画一幅吧！</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {history.map((drawing) => (
            <div key={drawing.id} className="bg-white border border-zinc-200 rounded-3xl overflow-hidden group">
              <div className="aspect-video bg-zinc-100 relative">
                <img 
                  src={drawing.originalImage} 
                  alt="Original" 
                  className="w-full h-full object-contain"
                />
                {drawing.refinedImage && (
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-zinc-100">
                    <img 
                      src={drawing.refinedImage} 
                      alt="Refined" 
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-2 right-2 bg-purple-500/80 backdrop-blur-sm text-[#ffffff] text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> AI 优化
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm text-zinc-500">
                    {new Date(drawing.timestamp).toLocaleString('zh-CN', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                  <div className="text-xs px-2 py-1 rounded-full bg-zinc-100 text-zinc-600">
                    专注 ~15分钟
                  </div>
                </div>
                {drawing.prompt && (
                  <p className="text-sm text-zinc-600 mt-2 line-clamp-2">
                    <span className="text-purple-400">提示词：</span>{drawing.prompt}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );

  const renderAnalysisPanel = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between bg-white border border-zinc-200 rounded-3xl p-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-purple-400" />
            深度成长分析
          </h2>
          <p className="text-zinc-500 mt-1">基于多维数据的综合评估报告</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cumulative Growth Area Chart */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6">
          <h3 className="text-xl font-bold mb-6">累计创作增长曲线</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumulativeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-zinc-200)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--color-zinc-500)" axisLine={false} tickLine={false} />
                <YAxis stroke="var(--color-zinc-500)" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-white)', border: '1px solid var(--color-zinc-200)', borderRadius: '12px', color: 'var(--color-zinc-900)' }} />
                <Area type="monotone" dataKey="cumulative" name="累计作品" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorCumulative)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Usage Trend Line Chart */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6">
          <h3 className="text-xl font-bold mb-6">专注时长趋势</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-zinc-200)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--color-zinc-500)" axisLine={false} tickLine={false} />
                <YAxis stroke="var(--color-zinc-500)" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-white)', border: '1px solid var(--color-zinc-200)', borderRadius: '12px', color: 'var(--color-zinc-900)' }} />
                <Line type="monotone" dataKey="focusTime" name="专注时长(分钟)" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Text Insights */}
        <div className="lg:col-span-2 bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/20 rounded-3xl p-8">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-purple-300">
            <Sparkles className="w-5 h-5" />
            AI 综合评价
          </h3>
          <div className="space-y-4 text-zinc-600 leading-relaxed">
            <p>
              根据近期的绘画数据分析，宝贝展现出了<strong className="text-zinc-900">极高的创作热情</strong>。
              累计完成了 {totalDrawings} 幅作品，平均每次专注时间稳定。
            </p>
            <p>
              在色彩运用上，宝贝偏爱<strong className="text-zinc-900">明亮、高饱和度的颜色</strong>，这反映了其性格中活泼开朗的一面。
              同时，有 {aiUsageRate}% 的作品使用了 AI 魔法棒功能，说明宝贝对新鲜事物充满好奇，愿意尝试人机协作的创新表达。
            </p>
            <p>
              <strong className="text-emerald-400">建议：</strong>可以尝试引导宝贝在不同时段（如早晨）进行创作，或者鼓励使用更多冷色调，以培养更全面的色彩感知能力。
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderMetricDetail = () => {
    let title = '';
    let description = '';
    let icon = null;
    let content = null;

    switch (activePanel) {
      case 'total-drawings':
        title = '累计创作明细';
        description = '查看宝贝近期的创作频率与产出波动';
        icon = <ImageIcon className="w-6 h-6 text-blue-400" />;
        content = (
          <div className="bg-white border border-zinc-200 rounded-3xl p-6">
            <h3 className="text-xl font-bold mb-6">近14日创作数量趋势</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={extendedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-zinc-200)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--color-zinc-500)" axisLine={false} tickLine={false} />
                  <YAxis stroke="var(--color-zinc-500)" axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--color-white)', border: '1px solid var(--color-zinc-200)', borderRadius: '12px', color: 'var(--color-zinc-900)' }} cursor={{ fill: 'rgba(128,128,128,0.1)' }} />
                  <Bar dataKey="drawings" name="作品数" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
        break;
      case 'focus-time':
        title = '专注时长明细';
        description = '了解宝贝每天在画画上投入的时间波动';
        icon = <Clock className="w-6 h-6 text-emerald-400" />;
        content = (
          <div className="bg-white border border-zinc-200 rounded-3xl p-6">
            <h3 className="text-xl font-bold mb-6">近14日专注时长波动 (分钟)</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={extendedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-zinc-200)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--color-zinc-500)" axisLine={false} tickLine={false} />
                  <YAxis stroke="var(--color-zinc-500)" axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--color-white)', border: '1px solid var(--color-zinc-200)', borderRadius: '12px', color: 'var(--color-zinc-900)' }} />
                  <Area type="monotone" dataKey="focusTime" name="专注时长" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorFocus)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
        break;
      case 'ai-usage':
        title = 'AI 互动率明细';
        description = '分析宝贝使用 AI 魔法棒的频率与偏好';
        icon = <Sparkles className="w-6 h-6 text-purple-400" />;
        content = (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-zinc-200 rounded-3xl p-6">
              <h3 className="text-xl font-bold mb-6">近14日 AI 互动趋势</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={extendedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-zinc-200)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--color-zinc-500)" axisLine={false} tickLine={false} />
                    <YAxis stroke="var(--color-zinc-500)" axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--color-white)', border: '1px solid var(--color-zinc-200)', borderRadius: '12px', color: 'var(--color-zinc-900)' }} />
                    <Line type="monotone" dataKey="aiUsed" name="AI使用次数" stroke="#a855f7" strokeWidth={3} dot={{ r: 4, fill: '#a855f7' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white border border-zinc-200 rounded-3xl p-6">
              <h3 className="text-xl font-bold mb-6">创作方式占比</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: '独立创作', value: totalDrawings - aiUsedCount },
                        { name: 'AI 辅助', value: aiUsedCount }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#a855f7" />
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--color-white)', border: '1px solid var(--color-zinc-200)', borderRadius: '12px', color: 'var(--color-zinc-900)' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );
        break;
      case 'activity':
        title = '近期活跃度明细';
        description = '展示宝贝在不同时间段的创作活跃程度波动';
        icon = <Activity className="w-6 h-6 text-orange-400" />;
        content = (
          <div className="bg-white border border-zinc-200 rounded-3xl p-6">
            <h3 className="text-xl font-bold mb-6">近14日活跃度波动分析</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={extendedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-zinc-200)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--color-zinc-500)" axisLine={false} tickLine={false} />
                  <YAxis stroke="var(--color-zinc-500)" axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--color-white)', border: '1px solid var(--color-zinc-200)', borderRadius: '12px', color: 'var(--color-zinc-900)' }} cursor={{ fill: 'rgba(128,128,128,0.1)' }} />
                  <Bar dataKey="drawings" name="活跃指数" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
        break;
      default:
        return null;
    }

    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between bg-white border border-zinc-200 rounded-3xl p-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              {icon}
              {title}
            </h2>
            <p className="text-zinc-500 mt-1">{description}</p>
          </div>
        </div>
        {content}
      </motion.div>
    );
  };

  return (
    <div 
      ref={containerRef}
      className="h-screen h-[100dvh] bg-zinc-50 text-zinc-900 p-6 md:p-12 overflow-y-auto overflow-x-hidden transition-colors duration-500"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="max-w-[1600px] mx-auto">
        <header className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <button 
            onClick={() => {
              if (activePanel === 'overview') onBack();
              else setActivePanel('overview');
            }}
            className="p-3 rounded-2xl bg-white border border-zinc-200 hover:bg-zinc-50 transition-all mr-6 group"
          >
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight">
              {activePanel === 'overview' && '家长监控中心'}
              {activePanel === 'badges' && '成就徽章'}
              {activePanel === 'history' && '作品明细'}
              {activePanel === 'analysis' && '深度分析'}
              {['total-drawings', 'focus-time', 'ai-usage', 'activity'].includes(activePanel) && '数据明细'}
            </h1>
            <p className="text-zinc-500 mt-1">
              {activePanel === 'overview' && '了解宝贝的创作行为与成长轨迹'}
              {activePanel === 'badges' && '查看宝贝获得的荣誉与激励'}
              {activePanel === 'history' && '回顾每一次充满想象力的落笔'}
              {activePanel === 'analysis' && '多维度数据解读宝贝的艺术潜能'}
              {['total-drawings', 'focus-time', 'ai-usage', 'activity'].includes(activePanel) && '深入了解各项指标的波动趋势'}
            </p>
          </div>
        </div>
        
        {/* Breadcrumb / Nav indicators if not in overview */}
        {['total-drawings', 'focus-time', 'ai-usage', 'activity'].includes(activePanel) && (
          <button 
            onClick={() => setActivePanel('overview')}
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-full text-sm font-medium transition-colors"
          >
            返回总览
          </button>
        )}
      </header>

      {/* Main Navigation Tabs */}
      {['overview', 'badges', 'history', 'analysis'].includes(activePanel) && (
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2 hide-scrollbar">
          {[
            { id: 'overview', label: '总览', icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'badges', label: '成就徽章', icon: <Award className="w-4 h-4" /> },
            { id: 'history', label: '作品明细', icon: <Calendar className="w-4 h-4" /> },
            { id: 'analysis', label: '深度分析', icon: <TrendingUp className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActivePanel(tab.id as PanelType)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full whitespace-nowrap transition-all ${
                activePanel === tab.id 
                  ? 'bg-blue-500 text-[#ffffff] font-bold shadow-lg shadow-blue-500/20' 
                  : 'bg-white text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 border border-zinc-100'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {activePanel === 'overview' && <motion.div key="overview">{renderOverview()}</motion.div>}
        {activePanel === 'badges' && <motion.div key="badges">{renderBadgesPanel()}</motion.div>}
        {activePanel === 'history' && <motion.div key="history">{renderHistoryPanel()}</motion.div>}
        {activePanel === 'analysis' && <motion.div key="analysis">{renderAnalysisPanel()}</motion.div>}
        {['total-drawings', 'focus-time', 'ai-usage', 'activity'].includes(activePanel) && <motion.div key="metric-detail">{renderMetricDetail()}</motion.div>}
      </AnimatePresence>

      {/* Badge Modal */}
      <AnimatePresence>
        {selectedBadge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white\/80 backdrop-blur-sm"
            onClick={() => setSelectedBadge(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
              className="bg-white border border-zinc-200 p-8 rounded-3xl max-w-sm w-full relative flex flex-col items-center text-center shadow-2xl shadow-yellow-500/20"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sparkle effects around the badge */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute w-64 h-64 bg-yellow-500/20 rounded-full blur-3xl -z-10"
              />
              
              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", delay: 0.2, duration: 0.8 }}
                className="w-32 h-32 mb-6 relative"
              >
                <img 
                  src={selectedBadge.icon} 
                  alt={selectedBadge.name}
                  className="w-full h-full object-cover drop-shadow-2xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <Award className="w-full h-full hidden text-yellow-400 drop-shadow-2xl" />
              </motion.div>

              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-3xl font-bold text-yellow-400 mb-2"
              >
                {selectedBadge.name}
              </motion.h2>
              
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-zinc-500 mb-6 font-medium"
              >
                {selectedBadge.description}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-white border border-zinc-200 rounded-2xl p-4 w-full"
              >
                <p className="text-zinc-700 leading-relaxed italic">
                  "{selectedBadge.message}"
                </p>
              </motion.div>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                onClick={() => setSelectedBadge(null)}
                className="mt-8 px-8 py-3 bg-zinc-100 hover:bg-zinc-200 rounded-full font-bold transition-colors"
              >
                继续努力
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
};
