import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';

interface Props {
  data: { name: string; active: number; done: number }[];
}

export const IndividualProgressChart: React.FC<Props> = ({ data }) => {
  const { theme } = useTheme();

  const textColor = theme === 'light' ? '#003946' : '#f5e7c6';
  const gridColor = theme === 'light' ? 'rgba(0,57,70,0.08)' : 'rgba(245,231,198,0.08)';
  const tooltipBg = theme === 'light' ? '#d9caa8' : '#003946';
  const tooltipBorder = theme === 'light' ? '1px solid rgba(0,57,70,0.1)' : 'none';
  const barColor = theme === 'light' ? '#003946' : '#fbbc04';

  return (
    <div className="rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 bg-[#d9caa8] dark:bg-gradient-to-br dark:from-[#003946] dark:to-[#004d5e] border border-teal/10 dark:border-white/5">
      <h3 className="text-[11px] font-bold text-teal/70 dark:text-[#f5e7c6]/70 uppercase tracking-[0.15em] mb-4">
        Individual Progress
      </h3>
      <div className="h-52 overflow-y-auto overflow-x-hidden custom-scrollbar pr-1">
        <div style={{ height: `${Math.max(208, data.length * 40)}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={data}
              margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
              <XAxis 
                type="number" 
                tick={{ fontSize: 11, fill: textColor, fontWeight: 'bold' }} 
                tickLine={false} 
                axisLine={false}
                domain={[0, (dataMax: number) => Math.max(dataMax, 5)]}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: textColor, fontWeight: 'bold' }}
                tickLine={false}
                axisLine={false}
                width={60}
                interval={0}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  border: tooltipBorder,
                  borderRadius: '8px',
                  color: textColor,
                }}
                labelStyle={{ color: '#ebbc0f', fontWeight: 600 }}
                itemStyle={{ color: textColor }}
              />
              <Bar dataKey="done" name="Done" fill={barColor} radius={[0, 4, 4, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
