import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
  LabelList,
} from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';

interface Props {
  data: any[];
}

const STATUS_COLOR_MAP: Record<string, string> = {
  Pending: '#fbbc04',
  'In Progress': '#ffa06d',
  'On Hold': '#e06666',
  Acknowledge: '#387886', // Update acknowledge color to be more visible in light mode
};

// Custom label renderer: only show value if > 0
const renderLabel = (props: any) => {
  const { x, y, width, height, value } = props;
  if (!value || value === 0 || height < 14) return null;
  return (
    <text
      x={x + width / 2}
      y={y + height / 2}
      fill="#003946"
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize={11}
      fontWeight="bold"
    >
      {value}
    </text>
  );
};

export const TaskStatusChart: React.FC<Props> = ({ data }) => {
  const { theme } = useTheme();
  const [needsAngle, setNeedsAngle] = useState(window.innerWidth < 1440);

  useEffect(() => {
    const handleResize = () => setNeedsAngle(window.innerWidth < 1440);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const textColor = theme === 'light' ? '#003946' : '#f5e7c6';
  const gridColor = theme === 'light' ? 'rgba(0,57,70,0.08)' : 'rgba(245,231,198,0.08)';
  const tooltipBg = theme === 'light' ? '#d9caa8' : '#003946';
  const tooltipBorder = theme === 'light' ? '1px solid rgba(0,57,70,0.1)' : '1px solid rgba(255,255,255,0.1)';

  // Override acknowledge color for dark mode to keep it white
  const getStatusColor = (status: string) => {
    if (status === 'Acknowledge' && theme === 'dark') return '#ffffff';
    return STATUS_COLOR_MAP[status];
  };

  return (
    <div className="rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 bg-[#d9caa8] dark:bg-gradient-to-br dark:from-[#003946] dark:to-[#004d5e] border border-teal/10 dark:border-white/5">
      <h3 className="text-[11px] font-bold text-teal/70 dark:text-[#f5e7c6]/70 uppercase tracking-[0.15em] mb-4">
        Overall Tasks Status
      </h3>
      <div className="h-52" style={{ minHeight: '208px' }}>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-teal/40 dark:text-white/30 text-sm">
            No tasks to display
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: needsAngle ? 10 : 11, fill: textColor, fontWeight: 'bold' }} tickLine={false} axisLine={false} interval={0} angle={needsAngle ? -45 : 0} textAnchor={needsAngle ? "end" : "middle"} height={needsAngle ? 45 : 30} />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  border: tooltipBorder,
                  borderRadius: '8px',
                  color: textColor,
                }}
                itemStyle={{ color: textColor, fontWeight: 'bold' }}
              />
              <Legend verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: 11, color: textColor, fontWeight: 'bold', paddingTop: '10px' }} iconType="square" iconSize={10} />
              <Bar dataKey="On Hold" stackId="a" fill={getStatusColor('On Hold')}>
                <LabelList dataKey="On Hold" content={renderLabel} />
              </Bar>
              <Bar dataKey="In Progress" stackId="a" fill={getStatusColor('In Progress')}>
                <LabelList dataKey="In Progress" content={renderLabel} />
              </Bar>
              <Bar dataKey="Acknowledge" stackId="a" fill={getStatusColor('Acknowledge')}>
                <LabelList dataKey="Acknowledge" content={renderLabel} />
              </Bar>
              <Bar dataKey="Pending" stackId="a" fill={getStatusColor('Pending')}>
                <LabelList dataKey="Pending" content={renderLabel} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

