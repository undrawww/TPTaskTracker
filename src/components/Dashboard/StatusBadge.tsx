import React, { useState, useRef, useEffect } from 'react';
import { TASK_STATUSES, type TaskStatus } from '../../types';

interface Props {
  status: TaskStatus;
  onChange: (newStatus: TaskStatus) => void;
  disabled?: boolean;
}

export const STATUS_STYLES: Record<TaskStatus, { bg: string; text: string; ring: string; dot: string; dropdownText: string; dropdownDot: string }> = {
  Done:          { bg: 'bg-[#dcfce7] dark:bg-[#003946]', text: 'text-[#22c55e]', ring: 'ring-[#22c55e]', dot: 'bg-[#22c55e]', dropdownText: 'text-[#22c55e]', dropdownDot: 'bg-[#22c55e]' },
  Pending:       { bg: 'bg-[#fef9c3] dark:bg-[#003946]', text: 'text-[#fbbc04]', ring: 'ring-[#fbbc04]', dot: 'bg-[#fbbc04]', dropdownText: 'text-[#fbbc04]', dropdownDot: 'bg-[#fbbc04]' },
  'In Progress': { bg: 'bg-[#dbeafe] dark:bg-[#003946]', text: 'text-[#ffa06d]', ring: 'ring-[#ffa06d]', dot: 'bg-[#ffa06d]', dropdownText: 'text-[#ffa06d]', dropdownDot: 'bg-[#ffa06d]' },
  'On Hold':     { bg: 'bg-[#fee2e2] dark:bg-[#003946]', text: 'text-[#e06666]', ring: 'ring-[#e06666]', dot: 'bg-[#e06666]', dropdownText: 'text-[#e06666]', dropdownDot: 'bg-[#e06666]' },
  Acknowledge:   { 
    bg: 'bg-white dark:bg-[#003946]', 
    text: 'text-[#003946] dark:text-white', 
    ring: 'ring-[#003946] dark:ring-white', 
    dot: 'bg-[#003946] dark:bg-white',
    dropdownText: 'text-[#003946] dark:text-white',
    dropdownDot: 'bg-[#003946] dark:bg-white'
  },
};

export const StatusBadge: React.FC<Props> = ({ status, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const style = STATUS_STYLES[status];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
          ${style.bg} ${style.text}
          ${disabled ? 'opacity-70 cursor-not-allowed' : `hover:ring-2 ${style.ring} hover:ring-opacity-40 cursor-pointer`}
          transition-all duration-200
        `}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
        {status}
        {!disabled && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-40 bg-white dark:bg-[#003946] rounded-xl shadow-lg border border-teal/10 dark:border-cream-dark/20 py-1 min-w-[140px] animate-slide-up">
          {TASK_STATUSES.map((s) => {
            const sStyle = STATUS_STYLES[s];
            const isActive = s === status;
            return (
              <button
                key={s}
                onClick={() => {
                  onChange(s);
                  setIsOpen(false);
                }}
                className={`
                  w-full text-left px-3 py-1.5 text-xs font-medium flex items-center gap-2
                  hover:bg-teal/5 dark:hover:bg-[#0a5060] transition-colors
                  ${isActive ? 'bg-teal/5 dark:bg-[#0a5060]' : ''}
                `}
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${sStyle.dropdownDot}`} />
                <span className={sStyle.dropdownText}>{s}</span>
                {isActive && (
                  <svg className="ml-auto text-teal/40 dark:text-white/40" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
