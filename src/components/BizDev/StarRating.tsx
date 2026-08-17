import React from 'react';
import { isRoleTBD } from '../../types/bizDevTypes';
import type { BizDevRole } from '../../types/bizDevTypes';

interface StarRatingProps {
  stars: number; // 0–3
  role: BizDevRole;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export const StarRating: React.FC<StarRatingProps> = ({ stars, role, onClick, size = 'md' }) => {
  const isTBD = isRoleTBD(role);
  const totalStars = 3;

  const sizeMap = {
    sm: { star: 14, gap: 'gap-0.5' },
    md: { star: 18, gap: 'gap-0.5' },
    lg: { star: 24, gap: 'gap-1' },
  };

  const { star: starSize, gap } = sizeMap[size];

  if (isTBD) {
    return (
      <div
        className={`inline-flex items-center ${gap} ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
        onClick={onClick}
        title="ASA milestones are not yet defined"
      >
        {Array.from({ length: totalStars }).map((_, i) => (
          <svg
            key={i}
            width={starSize}
            height={starSize}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-teal/15 dark:text-white/10"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ))}
        <span className="text-[9px] font-bold uppercase tracking-wider text-teal/25 dark:text-white/15 ml-1">TBD</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center ${gap} ${onClick ? 'cursor-pointer group' : ''}`}
      onClick={onClick}
      title={onClick ? 'Click to view details' : undefined}
    >
      {Array.from({ length: totalStars }).map((_, i) => {
        const filled = i < stars;
        return (
          <svg
            key={i}
            width={starSize}
            height={starSize}
            viewBox="0 0 24 24"
            fill={filled ? '#ebbc0f' : 'none'}
            stroke={filled ? '#ebbc0f' : 'currentColor'}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-all duration-300 ${
              filled
                ? 'drop-shadow-[0_0_3px_rgba(235,188,15,0.4)]'
                : 'text-teal/20 dark:text-white/15'
            } ${onClick ? 'group-hover:scale-110' : ''}`}
            style={{ transitionDelay: `${i * 50}ms` }}
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        );
      })}
    </div>
  );
};
