import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PokerTrendChart } from './PokerTrendChart';
import { GroupMember, DailyResult } from '../../types';

const MOCK_MEMBERS: GroupMember[] = [
  {
    groupId: 'grp-1',
    userId: 'usr-1',
    nickname: 'Thomas',
    role: 'owner',
    status: 'active',
    joinedAt: '2026-10-01'
  },
  {
    groupId: 'grp-1',
    userId: 'usr-2',
    nickname: 'Alexandre',
    role: 'member',
    status: 'active',
    joinedAt: '2026-10-01'
  }
];

const MOCK_RESULTS: DailyResult[] = [
  {
    id: '1',
    groupId: 'grp-1',
    userId: 'usr-1',
    resultDate: '2026-10-25',
    entryMode: 'detailed',
    total: 800,
    createdAt: '',
    updatedAt: ''
  },
  {
    id: '2',
    groupId: 'grp-1',
    userId: 'usr-2',
    resultDate: '2026-10-25',
    entryMode: 'total',
    total: 1050,
    createdAt: '',
    updatedAt: ''
  }
];

describe('PokerTrendChart - Graphique multi-joueurs', () => {
  it('affiche les boutons de filtre temporel (7 jours, 30 jours, Historique)', () => {
    render(<PokerTrendChart members={MOCK_MEMBERS} results={MOCK_RESULTS} currentUserId="usr-1" />);

    expect(screen.getByRole('button', { name: /7 jours/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /30 jours/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /historique/i })).toBeInTheDocument();
  });

  it('affiche les badges de contrôle des joueurs avec boutons de masquage', () => {
    render(<PokerTrendChart members={MOCK_MEMBERS} results={MOCK_RESULTS} currentUserId="usr-1" />);

    expect(screen.getByTitle('Masquer Thomas')).toBeInTheDocument();
    expect(screen.getByTitle('Masquer Alexandre')).toBeInTheDocument();
    expect(screen.getByTitle('Isoler Thomas')).toBeInTheDocument();
  });

  it('permet de basculer la visibilité d’un joueur au clic', async () => {
    const user = userEvent.setup();
    render(<PokerTrendChart members={MOCK_MEMBERS} results={MOCK_RESULTS} currentUserId="usr-1" />);

    const thomasToggle = screen.getByTitle('Masquer Thomas');
    await user.click(thomasToggle);

    expect(screen.getByTitle('Afficher Thomas')).toBeInTheDocument();
  });

  it('active la vue individuelle au clic sur le bouton Seul', async () => {
    const user = userEvent.setup();
    render(<PokerTrendChart members={MOCK_MEMBERS} results={MOCK_RESULTS} currentUserId="usr-1" />);

    const soloThomas = screen.getByTitle('Isoler Thomas');
    await user.click(soloThomas);

    expect(screen.getByTitle('Afficher tous les joueurs')).toBeInTheDocument();
  });
});
