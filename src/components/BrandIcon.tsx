import React from 'react';

interface BrandIconProps {
  className?: string;
  size?: number;
}

export const BrandIcon: React.FC<BrandIconProps> = ({ className = 'w-4 h-4', size }) => {
  const style = size ? { width: `${size}px`, height: `${size}px` } : undefined;

  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Folded Page Body */}
      <path
        d="M 20,16 L 62,16 L 80,34 L 80,84 L 20,84 Z"
        fill="#FAF9F6"
        stroke="#1E293B"
        strokeWidth="6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Folded Corner Triangle */}
      <path
        d="M 62,16 L 62,34 L 80,34 Z"
        fill="#E2E8F0"
        stroke="#1E293B"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      {/* Ruled Note Lines */}
      <line x1="32" y1="42" x2="68" y2="42" stroke="#94A3B8" strokeWidth="5" strokeLinecap="round" />
      <line x1="32" y1="53" x2="68" y2="53" stroke="#94A3B8" strokeWidth="5" strokeLinecap="round" />
      <line x1="32" y1="64" x2="68" y2="64" stroke="#94A3B8" strokeWidth="5" strokeLinecap="round" />
      {/* Blue Pixel Cursor Motif */}
      <rect x="32" y="72" width="16" height="6" fill="#2563EB" rx="1" />
    </svg>
  );
};
