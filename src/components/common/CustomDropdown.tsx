import React, { useState, useRef, useEffect } from 'react';

export interface CustomDropdownProps {
  value: any;
  options: { label: string; value: any }[];
  onChange: (val: any) => void;
  placeholder?: string;
  className?: string; // Optional custom classes for the button
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({ value, options, onChange, placeholder, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, []);

  const selectedOption = options.find((o) => o.value === value);
  const buttonClasses = className || "px-3 py-1.5 rounded-xl border border-cream-dark dark:border-teal-light bg-white dark:bg-[#003946] text-teal dark:text-cream text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gold";

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${buttonClasses}`}
      >
        <span>{selectedOption ? selectedOption.label : (placeholder || 'Select...')}</span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute z-50 mt-2 min-w-full w-max max-w-[250px] right-0 sm:left-0 sm:right-auto rounded-xl bg-white dark:bg-[#003946] shadow-lg border border-teal/10 dark:border-teal-light py-1 overflow-hidden max-h-60 overflow-y-auto">
          {options.map((option) => (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => { onChange(option.value); setIsOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-teal/5 dark:hover:bg-white/5 transition-colors ${
                value === option.value 
                  ? 'bg-teal/5 dark:bg-white/5 font-semibold text-teal dark:text-cream' 
                  : 'text-teal/80 dark:text-cream/80'
              } truncate`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
