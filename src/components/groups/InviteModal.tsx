import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { createInviteCode } from '../../services/groups';
import { X, Copy, Check, KeyRound, ShieldAlert } from 'lucide-react';

export interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  userId: string;
}

export const InviteModal: React.FC<InviteModalProps> = ({ isOpen, onClose, groupId, userId }) => {
  const [maxUses, setMaxUses] = useState(10);
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await createInviteCode(groupId, userId, maxUses, expiresInDays);
      if (res.error) {
        setError(res.error);
      } else if (res.code) {
        setGeneratedCode(res.code);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la génération');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

        <div className="mb-4">
          <span className="font-serif font-black text-lg text-[#f5ebd7] tracking-wider uppercase block">
            Inviter un collègue
          </span>
          <p className="text-xs text-slate-400 mt-0.5">
            Générez un code temporaire pour intégrer un nouveau joueur à la table
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/70 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!generatedCode ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nombre maximum d'utilisations
              </label>
              <select
                value={maxUses}
                onChange={(e) => setMaxUses(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-[#08140e] border border-[#1b3d2c] text-sm text-white focus:outline-none focus:border-[#c5a059]"
              >
                <option value={1}>1 utilisation (usage unique)</option>
                <option value={5}>5 utilisations</option>
                <option value={10}>10 utilisations</option>
                <option value={20}>20 utilisations</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Validité du code
              </label>
              <select
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-[#08140e] border border-[#1b3d2c] text-sm text-white focus:outline-none focus:border-[#c5a059]"
              >
                <option value={2}>48 heures</option>
                <option value={7}>7 jours</option>
                <option value={14}>14 jours</option>
                <option value={30}>30 jours</option>
              </select>
            </div>

            <Button
              variant="primary"
              fullWidth
              size="md"
              disabled={loading}
              onClick={handleGenerate}
              className="mt-4"
            >
              <KeyRound className="w-4 h-4 mr-2" />
              {loading ? 'Génération du code...' : 'Générer le code d’invitation'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#08140e] border border-[#c5a059]/40 text-center space-y-2">
              <span className="text-[10px] font-serif uppercase tracking-widest text-[#dfba73]">
                Code à transmettre au collègue
              </span>
              <p className="font-mono font-black text-2xl tracking-widest text-white selection:bg-[#c5a059] selection:text-[#08140e]">
                {generatedCode}
              </p>
              <p className="text-[11px] text-slate-400">
                Valable {expiresInDays} jours • Max {maxUses} joueur(s)
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="primary"
                fullWidth
                size="md"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-1.5" />
                    Copié dans le presse-papier !
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1.5" />
                    Copier le code
                  </>
                )}
              </Button>
            </div>

            <button
              onClick={() => setGeneratedCode(null)}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-200 mt-2"
            >
              Générer un autre code
            </button>
          </div>
        )}
      </Card>
    </div>
  );
};
