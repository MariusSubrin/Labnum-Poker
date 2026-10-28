import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'gold' | 'success' | 'danger' | 'neutral' | 'chip';
  chipColor?: 'blue' | 'red' | 'black' | 'green' | 'white';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  chipColor,
  className,
  ...props
}) => {
  const variants = {
    gold: 'bg-gold-500/15 text-gold-400 border border-gold-500/30',
    success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    danger: 'bg-red-500/15 text-red-400 border border-red-500/30',
    neutral: 'bg-felt-800 text-slate-300 border border-felt-700',
    chip: ''
  };

  const chipStyles: Record<string, string> = {
    blue: 'bg-blue-600/20 text-blue-400 border border-blue-500/30',
    red: 'bg-red-600/20 text-red-400 border border-red-500/30',
    black: 'bg-slate-800 text-slate-300 border border-slate-600',
    green: 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30',
    white: 'bg-slate-200 text-slate-900 border border-slate-300 font-semibold'
  };

  const resolvedVariant = variant === 'chip' && chipColor ? chipStyles[chipColor] : variants[variant];

  return (
    <span
      className={twMerge(clsx(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
        resolvedVariant,
        className
      ))}
      {...props}
    >
      {children}
    </span>
  );
};
