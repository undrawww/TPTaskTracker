import React from 'react';

interface TimeStampButtonProps {
  label: string;
  timestamp: string | null;
  disabled: boolean;
  onClick: () => void;
  onUndo?: () => void;
  icon: React.ReactNode;
}

/** Format an ISO timestamp to a readable time string */
function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

export const TimeStampButton: React.FC<TimeStampButtonProps> = ({
  label,
  timestamp,
  disabled,
  onClick,
  onUndo,
  icon,
}) => {
  const isStamped = timestamp !== null;

  if (isStamped) {
    return (
      <div className="flex flex-col items-center justify-center gap-0.5 animate-fade-in group relative">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-teal/60 dark:text-cream/50">
          {label}
        </span>
        <div className="relative flex items-center justify-center">
          <span className="text-[13px] font-bold text-teal dark:text-teal-light whitespace-nowrap">
            {formatTime(timestamp)}
          </span>
          {onUndo && (
            <button
              onClick={onUndo}
              title="Undo this stamp"
              className="absolute -right-6 w-4 h-4 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all duration-200"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-10 h-10 mx-auto flex items-center justify-center rounded-xl
        transition-all duration-200 group relative
        ${disabled
          ? 'bg-teal/10 dark:bg-white/5 text-teal dark:text-white/30 cursor-not-allowed opacity-70'
          : 'bg-teal/10 dark:bg-gold/10 hover:bg-teal/20 dark:hover:bg-gold/20 text-teal dark:text-gold hover:text-[#004d5e] dark:hover:text-gold-dark border border-teal/30 dark:border-gold/30 hover:border-teal/50 dark:hover:border-gold/50 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-sm hover:shadow'
        }
      `}
    >
      <span className="w-5 h-5 flex items-center justify-center">
        {icon}
      </span>
    </button>
  );
};
