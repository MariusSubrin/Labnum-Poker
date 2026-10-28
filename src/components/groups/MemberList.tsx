import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { GroupMember } from '../../types';
import { archiveMember } from '../../services/groups';
import { formatChips } from '../../utils/chipCalculations';
import { UserPlus, UserX, Crown } from 'lucide-react';

export interface MemberListProps {
  members: (GroupMember & { chips?: number })[];
  currentUserId?: string;
  isOwner?: boolean;
  groupId: string;
  onInviteClick?: () => void;
  onMemberArchived?: () => void;
}

export const MemberList: React.FC<MemberListProps> = ({
  members,
  currentUserId,
  isOwner,
  groupId,
  onInviteClick,
  onMemberArchived
}) => {
  const [memberToArchive, setMemberToArchive] = useState<GroupMember | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmArchive = async () => {
    if (!memberToArchive) return;
    setLoading(true);
    setError(null);

    try {
      const res = await archiveMember(groupId, memberToArchive.userId);
      if (res.error) {
        setError(res.error);
      } else {
        setMemberToArchive(null);
        if (onMemberArchived) onMemberArchived();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l’archivage');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-serif font-black text-lg text-[#f5ebd7] tracking-wider uppercase">
            Membres de la Table
          </span>
          <p className="text-xs text-slate-400 mt-0.5">
            {members.filter((m) => m.status === 'active').length} actifs •{' '}
            {members.filter((m) => m.status === 'archived').length} archivés
          </p>
        </div>

        {isOwner && onInviteClick && (
          <Button variant="primary" size="sm" onClick={onInviteClick}>
            <UserPlus className="w-3.5 h-3.5 mr-1" />
            Inviter un collègue
          </Button>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-950/70 border border-red-800/60 text-red-300 text-xs">
          {error}
        </div>
      )}

      <Card className="bg-[#0b1a13] border-[#183525] divide-y divide-[#183525]">
        {members.map((member) => {
          const isMe = member.userId === currentUserId;
          const isArchived = member.status === 'archived';

          return (
            <div
              key={member.userId}
              className={`py-3.5 flex items-center justify-between first:pt-0 last:pb-0 ${
                isArchived ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#08140e] border border-[#1b3d2c] flex items-center justify-center font-serif font-bold text-xs text-[#dfba73]">
                  {member.nickname.substring(0, 2).toUpperCase()}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-100">{member.nickname}</span>
                    {member.role === 'owner' && (
                      <span className="text-[10px] text-[#dfba73] flex items-center gap-0.5 font-serif font-bold">
                        <Crown className="w-3 h-3 text-[#dfba73]" /> Table
                      </span>
                    )}
                    {isMe && (
                      <span className="text-[9px] font-bold text-[#dfba73] bg-[#c5a059]/15 px-1.5 py-0.2 rounded border border-[#c5a059]/30">
                        Moi
                      </span>
                    )}
                    {isArchived && (
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-800/80 px-1.5 py-0.2 rounded border border-slate-700">
                        Archivé
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">
                    {member.role === 'owner' ? 'Propriétaire' : 'Membre'} • Rejoint le{' '}
                    {new Date(member.joinedAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {typeof member.chips === 'number' && (
                  <div className="text-right">
                    <span className="font-serif font-bold text-base text-white">
                      {formatChips(member.chips)}
                    </span>
                    <p className="text-[10px] text-slate-400 font-mono">jetons</p>
                  </div>
                )}

                {/* Bouton Archiver pour le propriétaire */}
                {isOwner && !isMe && !isArchived && (
                  <button
                    onClick={() => setMemberToArchive(member)}
                    title={`Archiver ${member.nickname}`}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-400 bg-[#08140e] border border-[#1b3d2c] hover:border-red-800 transition-colors"
                  >
                    <UserX className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </Card>

      {/* Modal de confirmation d'archivage */}
      {memberToArchive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <Card variant="brass" className="w-full max-w-sm p-5 bg-[#0b1a13] space-y-4">
            <div>
              <span className="font-serif font-bold text-base text-white block">
                Archiver {memberToArchive.nickname} ?
              </span>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Ce joueur ne pourra plus accéder aux données privées de la table. Son historique de jetons reste intact pour garantir la justesse des classements passés.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                disabled={loading}
                onClick={() => setMemberToArchive(null)}
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                size="sm"
                fullWidth
                disabled={loading}
                onClick={confirmArchive}
              >
                {loading ? 'Archivage...' : 'Confirmer l’archivage'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
