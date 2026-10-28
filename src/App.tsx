import { useState } from 'react';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { Card } from './components/common/Card';
import { Button } from './components/common/Button';
import { AuthModal } from './components/auth/AuthModal';
import { JoinOrCreateGroupModal } from './components/groups/JoinOrCreateGroupModal';
import { InviteModal } from './components/groups/InviteModal';
import { MemberList } from './components/groups/MemberList';
import { ChipEntryForm } from './components/results/ChipEntryForm';
import { useAuth } from './context/AuthContext';
import { NavigationTab, GroupMember } from './types';
import { formatChips } from './utils/chipCalculations';
import {
  TrendingUp,
  Award,
  Calendar,
  AlertCircle,
  Plus,
  BookOpen,
  ArrowRight,
  UserPlus
} from 'lucide-react';

const DEFAULT_MEMBERS: (GroupMember & { chips: number })[] = [
  {
    groupId: 'demo-group',
    userId: 'user-1',
    nickname: 'Thomas',
    role: 'owner',
    status: 'active',
    joinedAt: '2026-09-01T10:00:00Z',
    chips: 845
  },
  {
    groupId: 'demo-group',
    userId: 'user-2',
    nickname: 'Alexandre',
    role: 'member',
    status: 'active',
    joinedAt: '2026-09-02T10:00:00Z',
    chips: 1120
  },
  {
    groupId: 'demo-group',
    userId: 'user-3',
    nickname: 'Sarah',
    role: 'member',
    status: 'active',
    joinedAt: '2026-09-03T10:00:00Z',
    chips: 790
  },
  {
    groupId: 'demo-group',
    userId: 'user-4',
    nickname: 'Julien',
    role: 'member',
    status: 'active',
    joinedAt: '2026-09-05T10:00:00Z',
    chips: 610
  },
  {
    groupId: 'demo-group',
    userId: 'user-5',
    nickname: 'Maxime',
    role: 'member',
    status: 'active',
    joinedAt: '2026-09-08T10:00:00Z',
    chips: 540
  },
  {
    groupId: 'demo-group',
    userId: 'user-6',
    nickname: 'Claire',
    role: 'member',
    status: 'active',
    joinedAt: '2026-09-10T10:00:00Z',
    chips: 480
  },
  {
    groupId: 'demo-group',
    userId: 'user-7',
    nickname: 'Nicolas',
    role: 'member',
    status: 'archived',
    joinedAt: '2026-09-01T10:00:00Z',
    archivedAt: '2026-10-15T18:00:00Z',
    chips: 350
  }
];

export function App() {
  const { user, profile, currentGroup, membership, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');

  // Modales
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Membres
  const [members, setMembers] = useState(DEFAULT_MEMBERS);

  const isOwner = membership?.role === 'owner' || (!membership && true); // Permis en mode démo
  const userDisplayName = profile?.displayName || membership?.nickname || (user ? user.email?.split('@')[0] : 'Thomas');
  const groupDisplayName = currentGroup?.name || 'Table des Collègues';
  const effectiveUserId = user?.id || 'user-1';
  const effectiveGroupId = currentGroup?.id || 'demo-group';

  return (
    <div className="min-h-screen flex flex-col bg-[#08140e] text-[#ecefed] pb-safe font-sans selection:bg-[#c5a059] selection:text-[#08140e]">
      {/* En-tête de table */}
      <Header
        groupName={groupDisplayName}
        userNickname={userDisplayName}
        isAuthenticated={Boolean(user)}
        isOwner={isOwner}
        onProfileClick={() => setActiveTab('players')}
        onLoginClick={() => setIsAuthModalOpen(true)}
        onLogoutClick={signOut}
        onInviteClick={() => setIsInviteModalOpen(true)}
      />

      {/* Corps principal */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* =========================================================================
            ONGLET 1 : TABLEAU DE BORD
           ========================================================================= */}
        {activeTab === 'dashboard' && (
          <section className="space-y-6" aria-labelledby="dashboard-heading">
            <div className="flex items-baseline justify-between border-b border-[#1c3527] pb-3">
              <div>
                <h1 id="dashboard-heading" className="font-serif font-black text-xl sm:text-2xl text-[#f5ebd7] tracking-wider uppercase">
                  État de la Table
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">Session en cours • 7 joueurs au tapis</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-medium text-[#dfba73] bg-[#0e2219] px-2.5 py-1 rounded border border-[#c5a059]/30">
                  28 OCT. 2026
                </span>
              </div>
            </div>

            {/* Bilan personnel - Look Feutre Haut de Gamme */}
            <Card variant="brass" className="relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div>
                  <span className="text-[11px] font-bold font-serif uppercase tracking-widest text-[#dfba73]">
                    Mon Tapis Actuel
                  </span>
                  <div className="flex items-baseline gap-2.5 mt-1.5">
                    <span className="font-serif text-4xl sm:text-5xl font-black text-[#ffffff] tracking-tight">
                      {formatChips(845)}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">jetons</span>
                  </div>

                  <div className="flex items-center gap-3 mt-3">
                    <span className="inline-flex items-center text-xs font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-2.5 py-1 rounded-lg">
                      <TrendingUp className="w-3.5 h-3.5 mr-1" />
                      +125 vs session précédente
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      28/10/2026
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setActiveTab('count')}
                    className="shadow-lg shadow-black/50"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Enregistrer mon stock
                  </Button>
                </div>
              </div>
            </Card>

            {/* Chiffres clés & Records */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card padding="sm" className="bg-[#0b1a13] border-[#183525]">
                <span className="text-[11px] font-medium text-slate-400">Record personnel</span>
                <p className="font-serif text-xl font-bold text-[#f5ebd7] mt-1">1 240</p>
                <span className="text-[10px] text-[#dfba73] flex items-center gap-1 mt-1 font-mono">
                  <Award className="w-3 h-3" /> 14/10/2026
                </span>
              </Card>

              <Card padding="sm" className="bg-[#0b1a13] border-[#183525]">
                <span className="text-[11px] font-medium text-slate-400">Plus forte hausse</span>
                <p className="font-serif text-xl font-bold text-emerald-400 mt-1">+340</p>
                <span className="text-[10px] text-slate-400 mt-1 block">Gain sur une séance</span>
              </Card>

              <Card padding="sm" className="bg-[#0b1a13] border-[#183525]">
                <span className="text-[11px] font-medium text-slate-400">Plus forte baisse</span>
                <p className="font-serif text-xl font-bold text-red-400 mt-1">-180</p>
                <span className="text-[10px] text-slate-400 mt-1 block">Perte sur une séance</span>
              </Card>

              <Card padding="sm" className="bg-[#0b1a13] border-[#183525]">
                <span className="text-[11px] font-medium text-slate-400">Relevés validés</span>
                <p className="font-serif text-xl font-bold text-slate-200 mt-1">24</p>
                <span className="text-[10px] text-slate-400 mt-1 block">Jours de jeu suivis</span>
              </Card>
            </div>

            {/* Classement de la table */}
            <Card className="bg-[#0b1a13] border-[#183525]">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#183525]">
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-sm text-[#f5ebd7] tracking-wider uppercase">
                    Classement de la table
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 bg-[#0e2219] px-2 py-0.5 rounded border border-[#1b3d2c]">
                    7 joueurs
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('players')}
                  className="text-xs text-[#dfba73] hover:text-[#f5ebd7] font-semibold flex items-center gap-1 transition-colors"
                >
                  Détails <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2">
                {[
                  { rank: 1, name: 'Alexandre', total: 1120, diff: '+85', date: '28/10' },
                  { rank: 2, name: 'Thomas', isMe: true, total: 845, diff: '+125', date: '28/10' },
                  { rank: 3, name: 'Sarah', total: 790, diff: '-40', date: '28/10' },
                  { rank: 4, name: 'Julien', total: 610, diff: '0', date: '27/10', warning: 'Relevé du 27/10 (non synchronisé)' }
                ].map((player) => (
                  <div
                    key={player.rank}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                      player.isMe
                        ? 'bg-[#12281d] border-[#c5a059]/40'
                        : 'bg-[#08140e] border-[#183525] hover:border-[#224734]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 text-center font-serif font-black text-xs ${
                        player.rank === 1 ? 'text-[#dfba73]' : 'text-slate-400'
                      }`}>
                        #{player.rank}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-slate-100">{player.name}</p>
                          {player.isMe && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-[#dfba73] bg-[#c5a059]/15 px-1.5 py-0.2 rounded border border-[#c5a059]/30">
                              Moi
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {player.date}
                          {player.warning && (
                            <span className="ml-2 text-amber-400 inline-flex items-center gap-0.5">
                              <AlertCircle className="w-3 h-3 inline" /> {player.warning}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-serif font-black text-base text-[#ffffff]">{formatChips(player.total)}</p>
                      <span className={`text-[11px] font-bold font-mono ${
                        player.diff.startsWith('+')
                          ? 'text-emerald-400'
                          : player.diff.startsWith('-')
                          ? 'text-red-400'
                          : 'text-slate-400'
                      }`}>
                        {player.diff}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        )}

        {/* =========================================================================
            ONGLET 2 : COMPTER (SAISIE DÉDIÉE DES JETONS)
           ========================================================================= */}
        {activeTab === 'count' && (
          <section className="space-y-6" aria-labelledby="count-heading">
            <ChipEntryForm
              groupId={effectiveGroupId}
              userId={effectiveUserId}
              timezone={currentGroup?.timezone || 'Europe/Paris'}
            />
          </section>
        )}

        {/* =========================================================================
            ONGLET 3 : JOUEURS (MEMBRES ET GESTION)
           ========================================================================= */}
        {activeTab === 'players' && (
          <section className="space-y-6" aria-labelledby="players-heading">
            <div className="flex items-baseline justify-between border-b border-[#1c3527] pb-3">
              <div>
                <h1 id="players-heading" className="font-serif font-black text-xl sm:text-2xl text-[#f5ebd7] tracking-wider uppercase">
                  Membres de la Table
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gestion des profils et invitations
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsGroupModalOpen(true)}
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1" />
                  Changer / Créer Table
                </Button>
              </div>
            </div>

            <MemberList
              members={members}
              currentUserId={effectiveUserId}
              isOwner={isOwner}
              groupId={effectiveGroupId}
              onInviteClick={() => setIsInviteModalOpen(true)}
              onMemberArchived={() => {
                setMembers((prev) =>
                  prev.map((m) =>
                    m.userId === 'user-4' ? { ...m, status: 'archived' } : m
                  )
                );
              }}
            />
          </section>
        )}

        {/* =========================================================================
            ONGLET 4 : MAINS (COMBINAISONS DE POKER)
           ========================================================================= */}
        {activeTab === 'hands' && (
          <section className="space-y-6" aria-labelledby="hands-heading">
            <div className="flex items-baseline justify-between border-b border-[#1c3527] pb-3">
              <div>
                <h1 id="hands-heading" className="font-serif font-black text-xl sm:text-2xl text-[#f5ebd7] tracking-wider uppercase flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#dfba73]" />
                  Combinaisons de Poker
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">Hiérarchie des 10 mains — Disponible hors-ligne</p>
              </div>
              <span className="text-[10px] font-mono text-[#dfba73] bg-[#0e2219] px-2 py-0.5 rounded border border-[#c5a059]/30">
                TEXAS HOLD'EM
              </span>
            </div>

            <div className="space-y-3">
              {[
                { rank: 1, name: 'Quinte Flush Royale', desc: 'As, Roi, Dame, Valet, 10 de la même couleur.', example: 'A♠ K♠ Q♠ J♠ 10♠', tie: 'Partage en cas d’égalité sur le tableau.' },
                { rank: 2, name: 'Quinte Flush', desc: 'Cinq cartes consécutives de la même couleur.', example: '9♥ 8♥ 7♥ 6♥ 5♥', tie: 'La plus haute carte au sommet de la suite l’emporte.' },
                { rank: 3, name: 'Carré', desc: 'Quatre cartes de même rang.', example: 'K♦ K♠ K♥ K♣ 9♠', tie: 'Le plus haut carré gagne. Si identique, le kicker le plus fort départage.' },
                { rank: 4, name: 'Full', desc: 'Trois cartes de même rang combinées à deux cartes d’un autre rang.', example: 'J♠ J♥ J♦ 8♣ 8♠', tie: 'Le plus haut brelan l’emporte, puis la paire en cas d’égalité.' },
                { rank: 5, name: 'Couleur (Flush)', desc: 'Cinq cartes de la même couleur, non consécutives.', example: 'A♣ J♣ 9♣ 6♣ 2♣', tie: 'La carte la plus haute l’emporte, puis la 2e, 3e, etc.' },
                { rank: 6, name: 'Quinte (Suite)', desc: 'Cinq cartes consécutives de couleurs différentes.', example: '8♠ 7♥ 6♦ 5♣ 4♠', tie: 'La plus haute carte de la suite l’emporte. L’As peut valoir 1 (A-2-3-4-5) ou 14 (10-J-Q-K-A).' },
                { rank: 7, name: 'Brelan', desc: 'Trois cartes de même rang.', example: '7♠ 7♥ 7♦ K♣ 2♠', tie: 'Le plus haut brelan l’emporte, puis les deux kickers dans l’ordre.' },
                { rank: 8, name: 'Deux Paires', desc: 'Deux paires distinctes de rang identique.', example: 'Q♠ Q♥ 9♦ 9♣ A♠', tie: 'La plus haute paire l’emporte, puis la 2e paire, puis le kicker.' },
                { rank: 9, name: 'Une Paire', desc: 'Deux cartes de même rang.', example: '10♠ 10♦ A♣ K♥ 4♠', tie: 'La plus haute paire l’emporte, puis les kickers du plus haut au plus bas.' },
                { rank: 10, name: 'Carte Haute', desc: 'Aucune combinaison formée.', example: 'A♠ K♦ J♣ 8♥ 3♠', tie: 'La carte la plus forte l’emporte, puis la suivante.' }
              ].map((hand) => (
                <Card key={hand.rank} padding="sm" className="bg-[#0b1a13] border-[#183525]">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#08140e] border border-[#1b3d2c] text-[#dfba73] flex items-center justify-center font-serif font-black text-xs shrink-0 mt-0.5">
                      #{hand.rank}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="font-serif font-bold text-sm text-[#f5ebd7]">{hand.name}</h3>
                        <span className="font-mono text-xs text-[#dfba73] tracking-wide">{hand.example}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{hand.desc}</p>
                      <p className="text-[11px] text-slate-400 mt-1 italic">Départage : {hand.tie}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Barre de navigation basse */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Modales d'authentification et gestion */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <JoinOrCreateGroupModal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} />
      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        groupId={effectiveGroupId}
        userId={effectiveUserId}
      />
    </div>
  );
}
