import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#dfba73] focus:ring-offset-2 focus:ring-offset-[#08140e] disabled:opacity-40 disabled:pointer-events-none select-none';

  const variants = {
    primary: 'bg-gradient-to-b from-[#e4c380] via-[#c5a059] to-[#a37f37] text-[#08140e] font-bold shadow-md shadow-black/40 hover:brightness-105 active:brightness-95 border border-[#edd8a6]/40',
    secondary: 'bg-[#132c20] text-slate-100 border border-[#1f4734] hover:bg-[#1a3c2c] active:bg-[#0e2219]',
    outline: 'border border-[#c5a059]/50 text-[#dfba73] hover:bg-[#c5a059]/10 active:bg-[#c5a059]/20',
    danger: 'bg-red-700/80 text-white hover:bg-red-700 active:bg-red-800 border border-red-600/40',
    ghost: 'text-slate-300 hover:text-white hover:bg-[#132c20]/60'
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5'
  };

  return (
    <button
      className={twMerge(clsx(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      ))}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
