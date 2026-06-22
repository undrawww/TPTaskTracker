import React from 'react';

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  accentColor?: 'gold' | 'teal';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  accentColor = 'teal',
}) => {
  const borderClass = accentColor === 'gold' ? 'border-gold' : 'border-teal';
  const valueClass = accentColor === 'gold' ? 'text-gold-dark dark:text-gold' : 'text-teal dark:text-[#f5e7c6]';
  const iconBgClass = accentColor === 'gold'
    ? 'bg-gradient-to-br from-gold/15 to-gold/5 text-gold-dark dark:text-gold'
    : 'bg-gradient-to-br from-teal/10 to-teal/5 text-teal/60 dark:text-cream/60';

  return (
    <div
      className={`
        bg-white dark:bg-[#002b36] rounded-2xl border-l-4 ${borderClass} p-5
        shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5
        border border-l-4 border-cream-dark/20 dark:border-teal-lighter/10
      `}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold text-teal/50 dark:text-cream/50 uppercase tracking-[0.1em] mb-1.5">
            {title}
          </p>
          <p className={`text-3xl font-extrabold ${valueClass} leading-none tabular-nums`}>
            {value}
          </p>
        </div>
        <div className={`w-11 h-11 rounded-xl ${iconBgClass} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );
};
