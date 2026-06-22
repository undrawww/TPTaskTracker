import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';


interface Props {
  data: any[];
}

const STATUS_COLOR_MAP: Record<string, string> = {
  Pending: '#fbbc04',
  'In Progress': '#ffa06d',
  'On Hold': '#e06666',
  Acknowledge: '#ffffff',
};

export const TaskStatusChart: React.FC<Props> = ({ data }) => {
  return (
    <div className="rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-[#003946] to-[#004d5e]">
      <h3 className="text-[11px] font-bold text-[#f5e7c6]/70 uppercase tracking-[0.15em] mb-4">
        Overall Tasks Status
      </h3>
      <div className="h-52" style={{ minHeight: '208px' }}>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white/30 text-sm">
            No tasks to display
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(245,231,198,0.08)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#f5e7c6', fontWeight: 'bold' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#003946',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#f5e7c6',
                }}
                itemStyle={{ color: '#f5e7c6', fontWeight: 'bold' }}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: '#f5e7c6', fontWeight: 'bold' }} iconType="square" iconSize={10} />
              <Bar dataKey="On Hold" stackId="a" fill={STATUS_COLOR_MAP['On Hold']} />
              <Bar dataKey="In Progress" stackId="a" fill={STATUS_COLOR_MAP['In Progress']} />
              <Bar dataKey="Acknowledge" stackId="a" fill={STATUS_COLOR_MAP['Acknowledge']} />
              <Bar dataKey="Pending" stackId="a" fill={STATUS_COLOR_MAP['Pending']} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
