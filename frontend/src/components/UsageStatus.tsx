import { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Activity, Zap, TrendingUp, Calendar, Crown, AlertCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Stats {
  plan: string;
  daily_limit: number;
  days: any[];
  summary: {
    total_committed: number;
    avg_daily: number;
    peak_day: { date: string; count: number };
    current_streak: number;
  };
}

const UsageStats = () => {
  const [data, setData] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [daysCount, setDaysCount] = useState(7);

  useEffect(() => {
    setLoading(true); // Включаем загрузку при смене фильтра
    axios.get(`${API_BASE_URL}/api/usage/stats?days=${daysCount}`)
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('API Error:', err);
        setError('Connection to analytics engine failed');
        setLoading(false);
      });
  }, [daysCount]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#030712]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
    </div>
  );

  if (error) return (
    <div className="flex h-screen items-center justify-center bg-[#030712]">
      <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-red-400">
        <AlertCircle size={24} />
        <span className="font-medium">{error}</span>
      </div>
    </div>
  );

  if (!data) return null;

  const todayUsage = data.days[data.days.length - 1];
  const usagePercent = Math.min((todayUsage.committed / data.daily_limit) * 100, 100);

  return (
    <div className="min-h-screen bg-[#030712] p-8 text-slate-200">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            {/* Left side: Titles */}
            <div className="space-y-1">
                <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Zap className="text-white" size={22} />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Usage Analytics</h1>
                </div>
                <p className="text-slate-400 text-sm ml-13">Monitoring system resources & turn consumption</p>
            </div>

            {/* Right side: Controls & Badge */}
            <div className="flex flex-wrap items-center gap-4">
                {/* Range Selector */}
                <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-md">
                {[7, 30, 90].map((d) => (
                    <button
                    key={d}
                    onClick={() => setDaysCount(d)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                        daysCount === d 
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/40' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                    >
                    {d === 7 ? '1 Week' : d === 30 ? '1 Month' : '3 Months'}
                    </button>
                ))}
                </div>

                {/* Plan Badge */}
                <div className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-blue-400 shadow-inner">
                <Crown size={18} className="animate-pulse" />
                <span className="text-xs font-black uppercase tracking-widest">{data.plan} Tier</span>
                </div>
            </div>
        </header>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          {[
            { label: 'Total Turns', value: data.summary.total_committed, icon: Activity, color: 'text-blue-400' },
            { label: 'Avg / Day', value: data.summary.avg_daily, icon: Zap, color: 'text-purple-400' },
            { label: 'Current Streak', value: `${data.summary.current_streak} days`, icon: TrendingUp, color: 'text-emerald-400' },
            { label: 'Peak Usage', value: data.summary.peak_day.count, icon: Calendar, color: 'text-orange-400' },
          ].map((item, i) => (
            <div key={i} className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-6 transition-all hover:bg-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">{item.label}</p>
                  <h3 className="mt-1 text-2xl font-bold text-white">{item.value}</h3>
                </div>
                <item.icon className={item.color} size={24} />
              </div>
              <div className={`absolute bottom-0 left-0 h-1 w-full opacity-0 transition-opacity group-hover:opacity-100 ${item.color.replace('text', 'bg')}`} />
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Chart Card */}
          <div className="rounded-2xl border border-white/5 bg-white/5 p-6 lg:col-span-2">
            <h3 className="mb-6 font-semibold text-white">Activity Overview</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.days} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '12px', color: '#fff' }}
                    cursor={{ fill: '#ffffff05' }}
                  />
                  <Bar dataKey="committed" radius={[4, 4, 0, 0]} barSize={32}>
                    {data.days.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === data.days.length - 1 ? '#3b82f6' : '#3b82f640'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Today's Limit Card */}
          <div className="flex flex-col justify-between rounded-2xl border border-white/5 bg-white/5 p-6">
            <div>
              <h3 className="mb-2 font-semibold text-white">Daily Quota</h3>
              <p className="text-sm text-slate-400 text-balance">Track your resource consumption for the current 24-hour window.</p>
            </div>

            <div className="my-8 flex flex-col items-center">
              <div className="relative flex h-32 w-32 items-center justify-center">
                <svg className="h-full w-full transform -rotate-90">
                  <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                  <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={364.4} 
                    strokeDashoffset={364.4 - (364.4 * usagePercent) / 100}
                    className="text-blue-500 transition-all duration-1000 ease-out" 
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-bold text-white">{todayUsage.committed}</span>
                  <span className="text-xs text-slate-400">/ {data.daily_limit}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Utilization</span>
                <span className="font-medium text-white">{usagePercent.toFixed(1)}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/5">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all" style={{ width: `${usagePercent}%` }} />
              </div>
              <p className="text-center text-xs text-slate-500 italic">
                {data.daily_limit - todayUsage.committed} turns remaining until reset
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsageStats;