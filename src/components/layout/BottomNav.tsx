import React from 'react';
import { Home, PlusCircle, Users, BookOpen } from 'lucide-react';
import { NavigationTab } from '../../types';
import { clsx } from 'clsx';

export interface BottomNavProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
}

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Accueil', icon: Home },
  { id: 'count', label: 'Compter', icon: PlusCircle },
  { id: 'players', label: 'Joueurs', icon: Users },
  { id: 'hands', label: 'Mains', icon: BookOpen }
];

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#08140e]/98 backdrop-blur-md border-t border-[#1c2d24] px-3 py-2 pb-[max(0.6rem,env(safe-area-inset-bottom))]"
    >
      <div className="max-w-md mx-auto grid grid-cols-4 gap-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={clsx(
                'flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-150 select-none relative',
                isActive
                  ? 'text-[#dfba73] font-bold'
                  : 'text-slate-400 hover:text-slate-200 active:scale-95 font-medium'
              )}
            >
              <div
                className={clsx(
                  'p-1.5 rounded-lg transition-all',
                  isActive ? 'bg-[#c5a059]/15' : 'bg-transparent'
                )}
              >
                <Icon className={clsx('w-5 h-5 transition-transform', isActive && 'scale-105')} />
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight font-sans">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
