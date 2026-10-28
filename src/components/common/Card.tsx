import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'brass' | 'table';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className,
  ...props
}) => {
  const paddings = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-6'
  };

  const variants = {
    default: 'bg-[#0d2017]/90 border border-[#1c3527] shadow-md shadow-black/40',
    brass: 'bg-[#0f241a] border border-[#c5a059]/40 shadow-lg shadow-black/50',
    table: 'bg-[#07130d] border border-[#14291e]'
  };

  return (
    <div
      className={twMerge(clsx(
        'rounded-2xl transition-all duration-200',
        variants[variant],
        paddings[padding],
        className
      ))}
      {...props}
    >
      {children}
    </div>
  );
};
