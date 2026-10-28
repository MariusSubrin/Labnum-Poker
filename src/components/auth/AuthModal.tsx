import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { signInWithPassword, signUpWithEmail, signInWithMagicLink } from '../../services/auth';
import { useAuth } from '../../context/AuthContext';
import { X, Mail, Key, User, CheckCircle2, AlertCircle } from 'lucide-react';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { isConfigured, refreshSession } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'magiclink'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      if (mode === 'magiclink') {
        const res = await signInWithMagicLink(email);
        if (res.error) {
          setMessage({ type: 'error', text: res.error });
        } else {
          setMessage({
            type: 'success',
            text: 'Lien de connexion envoyé ! Vérifiez votre boîte de réception.'
          });
        }
      } else if (mode === 'signup') {
        if (!displayName.trim()) {
          setMessage({ type: 'error', text: 'Veuillez saisir votre pseudo.' });
          setLoading(false);
          return;
        }
        const res = await signUpWithEmail(email, password, displayName);
        if (res.error) {
          setMessage({ type: 'error', text: res.error });
        } else {
          setMessage({
            type: 'success',
            text: 'Compte créé avec succès !'
          });
          await refreshSession();
          setTimeout(onClose, 1200);
        }
      } else {
        const res = await signInWithPassword(email, password);
        if (res.error) {
          setMessage({ type: 'error', text: res.error });
        } else {
          await refreshSession();
          onClose();
        }
      }
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Une erreur inattendue est survenue.' });
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

        <div className="mb-5">
          <span className="font-serif font-black text-lg text-[#f5ebd7] tracking-wider uppercase block">
            {mode === 'signup' ? 'Rejoindre le Club' : mode === 'magiclink' ? 'Lien Magique' : 'Connexion'}
          </span>
          <p className="text-xs text-slate-400 mt-0.5">
            {mode === 'signup'
              ? 'Créez votre compte pour enregistrer vos jetons'
              : mode === 'magiclink'
              ? 'Recevez un lien de connexion instantané par email'
              : 'Accédez à votre table de jeu'}
          </p>
        </div>

        {!isConfigured && (
          <div className="mb-4 p-3 rounded-xl bg-amber-950/60 border border-amber-800/40 text-amber-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Supabase n’est pas encore connecté via le fichier <code>.env</code>. Vous explorez actuellement l’interface en mode local.
            </span>
          </div>
        )}

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

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label htmlFor="auth-display-name" className="block text-xs font-semibold text-slate-300 mb-1">
                Pseudo à la table
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="auth-display-name"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ex: Thomas"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#08140e] border border-[#1b3d2c] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#c5a059]"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-xs font-semibold text-slate-300 mb-1">
              Adresse e-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.nom@entreprise.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#08140e] border border-[#1b3d2c] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#c5a059]"
              />
            </div>
          </div>

          {mode !== 'magiclink' && (
            <div>
              <label htmlFor="auth-password" className="block text-xs font-semibold text-slate-300 mb-1">
                Mot de passe
              </label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="auth-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#08140e] border border-[#1b3d2c] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#c5a059]"
                />
              </div>
            </div>
          )}

          <Button type="submit" variant="primary" fullWidth size="md" disabled={loading} className="mt-2">
            {loading
              ? 'Traitement...'
              : mode === 'signup'
              ? 'Créer mon compte'
              : mode === 'magiclink'
              ? 'M’envoyer le lien'
              : 'Se connecter'}
          </Button>
        </form>

        <div className="mt-4 pt-4 border-t border-[#183525] flex flex-col gap-2 text-center text-xs text-slate-400">
          {mode === 'signin' ? (
            <>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-[#dfba73] hover:underline font-semibold"
              >
                Pas encore de compte ? S'inscrire
              </button>
              <button
                type="button"
                onClick={() => setMode('magiclink')}
                className="text-slate-400 hover:text-slate-200"
              >
                Connexion sans mot de passe (Lien magique)
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setMode('signin')}
              className="text-[#dfba73] hover:underline font-semibold"
            >
              Déjà un compte ? Se connecter
            </button>
          )}
        </div>
      </Card>
    </div>
  );
};
