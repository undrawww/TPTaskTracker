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

interface Props {
  data: { name: string; active: number; done: number }[];
}

export const IndividualProgressChart: React.FC<Props> = ({ data }) => {
  return (
    <div className="rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-[#003946] to-[#004d5e]">
      <h3 className="text-[11px] font-bold text-[#f5e7c6]/70 uppercase tracking-[0.15em] mb-4">
        Individual Progress
      </h3>
      <div className="h-52" style={{ minHeight: '208px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(245,231,198,0.08)" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#f5e7c6', fontWeight: 'bold' }} tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: '#f5e7c6', fontWeight: 'bold' }}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#003946',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
              labelStyle={{ color: '#ebbc0f', fontWeight: 600 }}
              itemStyle={{ color: '#fff' }}
            />
            <Bar dataKey="done" name="Done" fill="#fbbc04" radius={[0, 4, 4, 0]} barSize={14} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
