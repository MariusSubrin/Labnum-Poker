import React from 'react';
import { ChipColor, CHIP_VALUES } from '../../types';
import { clsx } from 'clsx';

export interface PokerChipProps {
  color: ChipColor;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  count?: number;
  interactive?: boolean;
  onClick?: () => void;
  className?: string;
}

const CHIP_CONFIG: Record<
  ChipColor,
  {
    bg: string;
    border: string;
    spot: string;
    text: string;
    innerBorder: string;
    innerBg: string;
    centerText: string;
  }
> = {
  blue: {
    bg: 'bg-blue-700',
    border: 'border-blue-900',
    spot: 'bg-white',
    text: 'text-white',
    innerBorder: 'border-blue-400/40',
    innerBg: 'bg-blue-800',
    centerText: 'text-blue-100'
  },
  red: {
    bg: 'bg-red-700',
    border: 'border-red-900',
    spot: 'bg-white',
    text: 'text-white',
    innerBorder: 'border-red-400/40',
    innerBg: 'bg-red-800',
    centerText: 'text-red-100'
  },
  black: {
    bg: 'bg-neutral-900',
    border: 'border-neutral-950',
    spot: 'bg-amber-400',
    text: 'text-amber-400',
    innerBorder: 'border-neutral-700',
    innerBg: 'bg-neutral-950',
    centerText: 'text-amber-300'
  },
  green: {
    bg: 'bg-emerald-700',
    border: 'border-emerald-950',
    spot: 'bg-white',
    text: 'text-white',
    innerBorder: 'border-emerald-400/40',
    innerBg: 'bg-emerald-800',
    centerText: 'text-emerald-100'
  },
  white: {
    bg: 'bg-slate-100',
    border: 'border-slate-300',
    spot: 'bg-blue-600',
    text: 'text-slate-900',
    innerBorder: 'border-slate-300',
    innerBg: 'bg-white',
    centerText: 'text-slate-900'
  }
};

const SIZES = {
  sm: 'w-8 h-8 text-[10px]',
  md: 'w-12 h-12 text-xs',
  lg: 'w-16 h-16 text-sm',
  xl: 'w-20 h-20 text-base'
};

export const PokerChip: React.FC<PokerChipProps> = ({
  color,
  size = 'md',
  count,
  interactive = false,
  onClick,
  className
}) => {
  const conf = CHIP_CONFIG[color];
  const value = CHIP_VALUES[color];

  return (
    <div
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive && onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={clsx(
        'relative rounded-full aspect-square flex items-center justify-center select-none shadow-chip-drop border-2 transition-transform duration-150',
        conf.bg,
        conf.border,
        SIZES[size],
        interactive && 'cursor-pointer active:scale-95 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-brass-400',
        className
      )}
    >
      {/* Edge spots (crans de jeton de casino) */}
      <span className={clsx('absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1 rounded-b-sm', conf.spot)} />
      <span className={clsx('absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1 rounded-t-sm', conf.spot)} />
      <span className={clsx('absolute left-0 top-1/2 -translate-y-1/2 h-1.5 w-1 rounded-r-sm', conf.spot)} />
      <span className={clsx('absolute right-0 top-1/2 -translate-y-1/2 h-1.5 w-1 rounded-l-sm', conf.spot)} />

      {/* Cercle intérieur estampé */}
      <div
        className={clsx(
          'w-3/4 h-3/4 rounded-full flex flex-col items-center justify-center border border-dashed shadow-inner',
          conf.innerBg,
          conf.innerBorder
        )}
      >
        <span className={clsx('font-black font-serif tracking-tighter leading-none', conf.centerText)}>
          {value}
        </span>
      </div>

      {/* Badge de quantité si présent */}
      {typeof count === 'number' && (
        <span className="absolute -top-1.5 -right-1.5 bg-neutral-900 text-brass-400 border border-brass-500/50 text-[10px] font-bold px-1.5 py-0.2 rounded-full shadow-md">
          x{count}
        </span>
      )}
    </div>
  );
};
