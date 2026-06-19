import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import { DashboardStats } from '@smartapply/shared';
import { 
  Briefcase, 
  Target, 
  Send, 
  PhoneCall, 
  Award, 
  TrendingUp, 
  Loader2 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Dashboard() {
  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiFetch('/dashboard/stats'),
    refetchInterval: 15000, // Refresh stats every 15s to make it feel alive!
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl max-w-lg mx-auto text-center mt-10">
        Failed to load dashboard metrics. Ensure the API server is running.
      </div>
    );
  }

  // Formatting chart data
  const chartData = [
    { name: 'Saved', value: stats.statusCounts.Saved, color: '#a78bfa' },
    { name: 'Applied', value: stats.statusCounts.Applied, color: '#6366f1' },
    { name: 'Interview', value: stats.statusCounts.Interview, color: '#10b981' },
    { name: 'Offer', value: stats.statusCounts.Offer, color: '#f59e0b' },
    { name: 'Rejected', value: stats.statusCounts.Rejected, color: '#ef4444' },
  ];

  const cards = [
    {
      title: 'Jobs Scraped',
      value: stats.jobsScraped,
      description: 'Total jobs fetched from sources',
      icon: Briefcase,
      color: 'from-blue-600/20 to-indigo-600/20',
      iconColor: 'text-blue-400'
    },
    {
      title: 'Jobs Matched',
      value: stats.jobsMatched,
      description: 'Jobs matched with your resume',
      icon: Target,
      color: 'from-purple-600/20 to-pink-600/20',
      iconColor: 'text-purple-400'
    },
    {
      title: 'Applications Sent',
      value: stats.applicationsSent,
      description: 'Jobs applied to overall',
      icon: Send,
      color: 'from-indigo-600/20 to-violet-600/20',
      iconColor: 'text-indigo-400'
    },
    {
      title: 'Interview Rate',
      value: `${stats.interviewRate}%`,
      description: 'Applications leading to interviews',
      icon: PhoneCall,
      color: 'from-emerald-600/20 to-teal-600/20',
      iconColor: 'text-emerald-400'
    },
    {
      title: 'Offer Rate',
      value: `${stats.offerRate}%`,
      description: 'Conversion to job offers',
      icon: Award,
      color: 'from-amber-600/20 to-orange-600/20',
      iconColor: 'text-amber-400'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in p-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight gradient-text">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Real-time job matching and application analytics.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx} 
              className={`bg-gradient-to-br ${card.color} glass-panel p-6 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden`}
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-medium text-muted-foreground">{card.title}</span>
                <div className={`p-2 rounded-xl bg-white/5 ${card.iconColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-bold tracking-tight text-white mb-1">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </div>
          );
        })}
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kanban Phase Funnel Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-white/5 shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Application Pipeline Funnel</h2>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  contentStyle={{ 
                    background: 'rgba(8,12,28,0.9)', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '13px'
                  }} 
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={45}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dynamic Conversion Panel */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Conversion Summary</h2>
            <p className="text-xs text-muted-foreground mb-6">Overall success rates computed from submitted applications.</p>
          </div>

          <div className="flex justify-around items-center py-6">
            {/* Interview Rate Circle */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="56" cy="56" r="48" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="transparent" />
                  <circle 
                    cx="56" cy="56" r="48" 
                    stroke="#10b981" strokeWidth="8" fill="transparent" 
                    strokeDasharray={2 * Math.PI * 48}
                    strokeDashoffset={2 * Math.PI * 48 * (1 - stats.interviewRate / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute text-xl font-bold text-white">{stats.interviewRate}%</div>
              </div>
              <span className="text-sm font-medium text-gray-300">Interview Conversion</span>
            </div>

            {/* Offer Rate Circle */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="56" cy="56" r="48" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="transparent" />
                  <circle 
                    cx="56" cy="56" r="48" 
                    stroke="#f59e0b" strokeWidth="8" fill="transparent" 
                    strokeDasharray={2 * Math.PI * 48}
                    strokeDashoffset={2 * Math.PI * 48 * (1 - stats.offerRate / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute text-xl font-bold text-white">{stats.offerRate}%</div>
              </div>
              <span className="text-sm font-medium text-gray-300">Offer Conversion</span>
            </div>
          </div>

          <div className="mt-4 bg-white/5 border border-white/5 rounded-xl p-4 text-xs text-muted-foreground">
            💡 <span className="text-gray-200 font-medium">Pro tip:</span> Auto-matching updates score ratios instantly. Keep your resume sections updated under the "Resume Manager" page to ensure accurate mapping metrics.
          </div>
        </div>
      </div>
    </div>
  );
}
