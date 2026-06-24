import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { CHART_COLORS } from '../../types';
import type { DailyTask, AttendanceRecord } from '../../types';

interface ProfilePerformanceProps {
  tasks: DailyTask[];
  attendance: AttendanceRecord[];
}

export const ProfilePerformance: React.FC<ProfilePerformanceProps> = ({ tasks, attendance }) => {
  const chartData = useMemo(() => {
    // Generate data for the last 7 days
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

      // Count tasks completed on this day
      const completedTasks = tasks.filter(t => t.status === 'Done' && t.task_date === dateStr).length;
      
      // Count daily records/attendance items added on this day
      const dailyRecords = attendance.filter(a => a.attendance_date === dateStr && a.accomplishments).length;

      data.push({
        name: dayName,
        tasks: completedTasks,
        records: dailyRecords,
        total: completedTasks + dailyRecords,
      });
    }
    return data;
  }, [tasks, attendance]);

  return (
    <div className="bg-[#d9caa8]/30 dark:bg-[#001a22] rounded-3xl border border-teal/10 dark:border-white/5 shadow-sm p-8 animate-fade-in flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal/40 dark:text-cream/40">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          <h2 className="text-lg font-bold text-teal dark:text-cream">Activity Summary</h2>
        </div>
        <div className="px-3 py-1 bg-teal/5 dark:bg-white/5 rounded-lg border border-teal/10 dark:border-white/5 text-[11px] font-bold text-teal dark:text-cream">
          This Week
        </div>
      </div>

      <div className="flex-1 min-h-[200px] w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-teal/10 dark:text-white/5" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: 'currentColor' }} 
              className="text-teal/50 dark:text-cream/40"
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: 'currentColor' }} 
              className="text-teal/50 dark:text-cream/40"
              dx={-10}
            />
            <Tooltip 
              cursor={{ fill: 'currentColor', className: 'text-teal/5 dark:text-white/5' }}
              contentStyle={{ backgroundColor: '#001a22', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px' }}
              itemStyle={{ color: '#ebbc0f', fontSize: '13px', fontWeight: 'bold' }}
              labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
            />
            <Bar dataKey="total" radius={[4, 4, 0, 0]} barSize={16}>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? CHART_COLORS.teal : CHART_COLORS.gold} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
