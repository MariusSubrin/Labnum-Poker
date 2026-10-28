import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemberList } from './MemberList';
import { GroupMember } from '../../types';

const MOCK_MEMBERS: (GroupMember & { chips: number })[] = [
  {
    groupId: 'grp-1',
    userId: 'usr-1',
    nickname: 'Thomas',
    role: 'owner',
    status: 'active',
    joinedAt: '2026-09-01T10:00:00Z',
    chips: 845
  },
  {
    groupId: 'grp-1',
    userId: 'usr-2',
    nickname: 'Sarah',
    role: 'member',
    status: 'active',
    joinedAt: '2026-09-02T10:00:00Z',
    chips: 790
  },
  {
    groupId: 'grp-1',
    userId: 'usr-3',
    nickname: 'Nicolas',
    role: 'member',
    status: 'archived',
    joinedAt: '2026-09-01T10:00:00Z',
    archivedAt: '2026-10-15T18:00:00Z',
    chips: 350
  }
];

describe('MemberList - Gestion des membres et archivage', () => {
  it('affiche tous les membres avec leurs statuts respectifs', () => {
    render(
      <MemberList
        members={MOCK_MEMBERS}
        currentUserId="usr-1"
        isOwner={true}
        groupId="grp-1"
      />
    );

    expect(screen.getByText('Thomas')).toBeInTheDocument();
    expect(screen.getByText('Sarah')).toBeInTheDocument();
    expect(screen.getByText('Nicolas')).toBeInTheDocument();
    expect(screen.getByText('Archivé')).toBeInTheDocument();
  });

  it('affiche le bouton d’archivage uniquement pour le propriétaire et pour les membres non archivés', () => {
    render(
      <MemberList
        members={MOCK_MEMBERS}
        currentUserId="usr-1"
        isOwner={true}
        groupId="grp-1"
      />
    );

    // Propriétaire (usr-1) ne peut pas s'archiver lui-même
    // Membre archivé (usr-3) ne doit pas avoir de bouton archiver
    // Seul usr-2 (Sarah) doit avoir un bouton d'archivage
    const archiveButtons = screen.getAllByTitle(/archiver/i);
    expect(archiveButtons).toHaveLength(1);
    expect(archiveButtons[0]).toHaveAttribute('title', 'Archiver Sarah');
  });

  it('ouvre une modale de confirmation lors du clic sur le bouton d’archivage', async () => {
    const user = userEvent.setup();
    render(
      <MemberList
        members={MOCK_MEMBERS}
        currentUserId="usr-1"
        isOwner={true}
        groupId="grp-1"
      />
    );

    const archiveBtn = screen.getByTitle('Archiver Sarah');
    await user.click(archiveBtn);

    expect(screen.getByText('Archiver Sarah ?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirmer l’archivage/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /annuler/i })).toBeInTheDocument();
  });

  it('masque le bouton d’invitation pour un simple membre non-propriétaire', () => {
    const handleInvite = vi.fn();
    render(
      <MemberList
        members={MOCK_MEMBERS}
        currentUserId="usr-2"
        isOwner={false}
        groupId="grp-1"
        onInviteClick={handleInvite}
      />
    );

    expect(screen.queryByRole('button', { name: /inviter un collègue/i })).not.toBeInTheDocument();
  });
});
