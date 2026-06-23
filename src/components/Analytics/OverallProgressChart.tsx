import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';

interface Props {
  data: { department: string; rate: number; completed: number; total: number }[];
}

export const OverallProgressChart: React.FC<Props> = ({ data }) => {
  const { theme } = useTheme();
  
  const barColors = theme === 'light'
    ? ['#003946', '#0a5060', '#1a6a7a', '#2a8494']
    : ['#fbbc04', '#fad02c', '#fce27b', '#fdf3b8'];

  const textColor = theme === 'light' ? '#003946' : '#f5e7c6';
  const gridColor = theme === 'light' ? 'rgba(0,57,70,0.08)' : 'rgba(245,231,198,0.08)';
  const tooltipBg = theme === 'light' ? '#d9caa8' : '#003946';
  const tooltipBorder = theme === 'light' ? '1px solid rgba(0,57,70,0.1)' : 'none';

  return (
    <div className="rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 bg-[#d9caa8] dark:bg-gradient-to-br dark:from-[#003946] dark:to-[#004d5e] border border-teal/10 dark:border-white/5">
      <h3 className="text-[11px] font-bold text-teal/70 dark:text-[#f5e7c6]/70 uppercase tracking-[0.15em] mb-4">
        Overall Progress
      </h3>
      <div className="h-52" style={{ minHeight: '208px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis
              dataKey="department"
              tick={{ fontSize: 11, fill: textColor, fontWeight: 'bold' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: textColor, fontWeight: 'bold' }}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              unit="%"
            />
            <Tooltip
              formatter={(value) => [`${value}%`, 'Completion']}
              contentStyle={{
                backgroundColor: tooltipBg,
                border: tooltipBorder,
                borderRadius: '8px',
                color: textColor,
              }}
              labelStyle={{ color: '#ebbc0f', fontWeight: 600 }}
              itemStyle={{ color: textColor }}
            />
            <Bar dataKey="rate" radius={[6, 6, 0, 0]} barSize={32}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
