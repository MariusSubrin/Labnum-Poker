import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { joinGroupWithCode, createGroup } from '../../services/groups';
import { useAuth } from '../../context/AuthContext';
import { X, Users, Plus, Hash, CheckCircle2, AlertCircle } from 'lucide-react';

export interface JoinOrCreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JoinOrCreateGroupModal: React.FC<JoinOrCreateGroupModalProps> = ({ isOpen, onClose }) => {
  const { refreshSession } = useAuth();
  const [tab, setTab] = useState<'join' | 'create'>('join');

  // État formulaire Rejoindre
  const [inviteCode, setInviteCode] = useState('');
  const [joinNickname, setJoinNickname] = useState('');

  // État formulaire Créer
  const [tableName, setTableName] = useState('');
  const [ownerNickname, setOwnerNickname] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const res = await joinGroupWithCode(inviteCode, joinNickname);
      if (res.error) {
        setMessage({ type: 'error', text: res.error });
      } else {
        setMessage({ type: 'success', text: 'Vous avez rejoint la table avec succès !' });
        await refreshSession();
        setTimeout(onClose, 1200);
      }
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Erreur inattendue' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const res = await createGroup(tableName, ownerNickname);
      if (res.error) {
        setMessage({ type: 'error', text: res.error });
      } else {
        setMessage({ type: 'success', text: 'Table de poker créée avec succès !' });
        await refreshSession();
        setTimeout(onClose, 1200);
      }
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Erreur inattendue' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <Card variant="brass" className="w-full max-w-md relative p-6 bg-[#0b1a13]">
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white bg-[#08140e] border border-[#1b3d2c]"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Onglets Rejoindre / Créer */}
        <div className="flex border-b border-[#1b3d2c] pb-3 mb-4">
          <button
            onClick={() => { setTab('join'); setMessage(null); }}
            className={`flex items-center gap-1.5 pb-2 text-xs font-serif font-bold uppercase tracking-wider transition-colors border-b-2 -mb-[13px] ${
              tab === 'join'
                ? 'border-[#dfba73] text-[#dfba73]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Rejoindre avec code
          </button>
          <button
            onClick={() => { setTab('create'); setMessage(null); }}
            className={`flex items-center gap-1.5 pb-2 ml-5 text-xs font-serif font-bold uppercase tracking-wider transition-colors border-b-2 -mb-[13px] ${
              tab === 'create'
                ? 'border-[#dfba73] text-[#dfba73]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Créer une table
          </button>
        </div>

        {message && (
          <div
            className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-950/70 border border-emerald-800/60 text-emerald-300'
                : 'bg-red-950/70 border border-red-800/60 text-red-300'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {tab === 'join' ? (
          <form onSubmit={handleJoin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Code d'invitation (fourni par votre collègue)
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="Ex: PK-8X42-KM9"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#08140e] border border-[#1b3d2c] font-mono font-bold text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#c5a059]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Votre pseudo pour cette table
              </label>
              <input
                type="text"
                required
                value={joinNickname}
                onChange={(e) => setJoinNickname(e.target.value)}
                placeholder="Ex: Alexandre"
                className="w-full px-3 py-2.5 rounded-xl bg-[#08140e] border border-[#1b3d2c] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <Button type="submit" variant="primary" fullWidth size="md" disabled={loading} className="mt-4">
              {loading ? 'Vérification du code...' : 'Prendre place à la table'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleCreate} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nom de la table
              </label>
              <input
                type="text"
                required
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="Ex: Table Labnum — Vendredi"
                className="w-full px-3 py-2.5 rounded-xl bg-[#08140e] border border-[#1b3d2c] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Votre pseudo (Propriétaire de table)
              </label>
              <input
                type="text"
                required
                value={ownerNickname}
                onChange={(e) => setOwnerNickname(e.target.value)}
                placeholder="Ex: Thomas"
                className="w-full px-3 py-2.5 rounded-xl bg-[#08140e] border border-[#1b3d2c] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <Button type="submit" variant="primary" fullWidth size="md" disabled={loading} className="mt-4">
              {loading ? 'Création de la table...' : 'Créer et ouvrir la table'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
};
