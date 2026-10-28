import React from 'react';
import { User, LogIn, LogOut, KeyRound } from 'lucide-react';

export interface HeaderProps {
  groupName?: string;
  userNickname?: string;
  isAuthenticated?: boolean;
  isOwner?: boolean;
  onProfileClick?: () => void;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
  onInviteClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  groupName = 'Table des Collègues',
  userNickname = 'Thomas',
  isAuthenticated = false,
  isOwner = false,
  onProfileClick,
  onLoginClick,
  onLogoutClick,
  onInviteClick
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#08140e]/95 backdrop-blur-md border-b border-[#1c2d24] px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Logo Club & Titre Table */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-b from-[#dfba73] to-[#8d6928] p-[1.5px] shadow-lg">
            <div className="w-full h-full rounded-full bg-[#0b1a13] flex items-center justify-center border border-[#1b3d2c]">
              <span className="font-serif font-black text-xs text-[#dfba73] tracking-wider">PL</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-sm tracking-widest text-[#f5ebd7] uppercase">
                Poker Ledger
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/80" />
            </div>
            <p className="text-[11px] text-slate-400 font-medium tracking-wide">{groupName}</p>
          </div>
        </div>

        {/* Actions utilisateur & invitations */}
        <div className="flex items-center gap-2">
          {isOwner && onInviteClick && (
            <button
              onClick={onInviteClick}
              aria-label="Inviter un joueur"
              className="hidden sm:flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-[#0e2219] border border-[#c5a059]/40 text-[#dfba73] text-xs font-semibold hover:bg-[#132c20] transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Inviter</span>
            </button>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-1">
              <button
                onClick={onProfileClick}
                aria-label="Accéder au profil"
                className="flex items-center gap-2 py-1.5 px-3 rounded-full bg-[#0e2219] border border-[#1c2d24] hover:border-[#c5a059]/40 transition-colors text-slate-200"
              >
                <div className="w-5 h-5 rounded-full bg-[#183125] flex items-center justify-center text-[#dfba73]">
                  <User className="w-3 h-3" />
                </div>
                <span className="text-xs font-semibold max-w-[110px] truncate text-slate-200">
                  {userNickname}
                </span>
              </button>

              {onLogoutClick && (
                <button
                  onClick={onLogoutClick}
                  aria-label="Se déconnecter"
                  title="Se déconnecter"
                  className="p-1.5 rounded-full text-slate-400 hover:text-red-400 hover:bg-[#0e2219] transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-[#0e2219] border border-[#c5a059]/40 hover:bg-[#132c20] text-xs font-semibold text-[#dfba73] transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Connexion</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
