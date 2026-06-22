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
import { CHART_COLORS } from '../../types';

interface Props {
  data: { department: string; rate: number; completed: number; total: number }[];
}

export const OverallProgressChart: React.FC<Props> = ({ data }) => {
  const barColors = [
    CHART_COLORS.teal,
    CHART_COLORS.tealLight,
    CHART_COLORS.tealLighter,
    CHART_COLORS.gold,
  ];

  return (
    <div className="rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-[#003946] to-[#004d5e]">
      <h3 className="text-[11px] font-bold text-[#f5e7c6]/70 uppercase tracking-[0.15em] mb-4">
        Overall Progress
      </h3>
      <div className="h-52" style={{ minHeight: '208px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(245,231,198,0.08)" vertical={false} />
            <XAxis
              dataKey="department"
              tick={{ fontSize: 11, fill: '#f5e7c6', fontWeight: 'bold' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#f5e7c6', fontWeight: 'bold' }}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              unit="%"
            />
            <Tooltip
              formatter={(value) => [`${value}%`, 'Completion']}
              contentStyle={{
                backgroundColor: '#003946',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
              labelStyle={{ color: '#ebbc0f', fontWeight: 600 }}
              itemStyle={{ color: '#fff' }}
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
