import { describe, it, expect } from 'vitest';
import {
  calculatePlayerStats,
  calculateLeaderboard,
  buildChartTimelineData
} from './statistics';
import { DailyResult, GroupMember } from '../types';

describe('statistics utils - Moteur de statistiques et historique', () => {
  const MOCK_RESULTS: DailyResult[] = [
    {
      id: 'r1',
      groupId: 'grp-1',
      userId: 'usr-1',
      resultDate: '2026-10-20',
      entryMode: 'detailed',
      total: 500,
      createdAt: '',
      updatedAt: ''
    },
    {
      id: 'r2',
      groupId: 'grp-1',
      userId: 'usr-1',
      resultDate: '2026-10-21',
      entryMode: 'detailed',
      total: 750, // +250
      createdAt: '',
      updatedAt: ''
    },
    {
      id: 'r3',
      groupId: 'grp-1',
      userId: 'usr-1',
      resultDate: '2026-10-22',
      entryMode: 'detailed',
      total: 620, // -130
      createdAt: '',
      updatedAt: ''
    },
    {
      id: 'r4',
      groupId: 'grp-1',
      userId: 'usr-1',
      resultDate: '2026-10-25',
      entryMode: 'detailed',
      total: 900, // +280 (Nouveau record)
      createdAt: '',
      updatedAt: ''
    }
  ];

  describe('calculatePlayerStats', () => {
    it('gère correctement un historique vide', () => {
      const stats = calculatePlayerStats([]);
      expect(stats.currentTotal).toBe(0);
      expect(stats.previousTotal).toBeNull();
      expect(stats.variation).toBeNull();
      expect(stats.personalBest).toBeNull();
      expect(stats.totalEntries).toBe(0);
    });

    it('gère un joueur avec un unique relevé (premier jour)', () => {
      const stats = calculatePlayerStats([MOCK_RESULTS[0]]);
      expect(stats.currentTotal).toBe(500);
      expect(stats.previousTotal).toBeNull();
      expect(stats.variation).toBeNull();
      expect(stats.personalBest?.total).toBe(500);
      expect(stats.totalEntries).toBe(1);
    });

    it('calcule exactement le record personnel, la plus forte hausse et la plus forte baisse', () => {
      const stats = calculatePlayerStats(MOCK_RESULTS);
      expect(stats.currentTotal).toBe(900);
      expect(stats.previousTotal).toBe(620);
      expect(stats.variation).toBe(280);
      expect(stats.personalBest?.total).toBe(900);
      expect(stats.personalBest?.date).toBe('2026-10-25');
      expect(stats.bestPositiveDiff?.amount).toBe(280);
      expect(stats.worstNegativeDiff?.amount).toBe(-130);
      expect(stats.totalEntries).toBe(4);
    });
  });

  describe('calculateLeaderboard', () => {
    const members: GroupMember[] = [
      {
        groupId: 'grp-1',
        userId: 'usr-1',
        nickname: 'Thomas',
        role: 'owner',
        status: 'active',
        joinedAt: '2026-09-01'
      },
      {
        groupId: 'grp-1',
        userId: 'usr-2',
        nickname: 'Alexandre',
        role: 'member',
        status: 'active',
        joinedAt: '2026-09-01'
      },
      {
        groupId: 'grp-1',
        userId: 'usr-3',
        nickname: 'Nicolas',
        role: 'member',
        status: 'archived',
        joinedAt: '2026-09-01',
        archivedAt: '2026-10-22'
      }
    ];

    const results: DailyResult[] = [
      ...MOCK_RESULTS, // usr-1 dernier relevé au 2026-10-25 (total 900)
      {
        id: 'r5',
        groupId: 'grp-1',
        userId: 'usr-2',
        resultDate: '2026-10-25',
        entryMode: 'total',
        total: 1100,
        createdAt: '',
        updatedAt: ''
      },
      {
        id: 'r6',
        groupId: 'grp-1',
        userId: 'usr-3',
        resultDate: '2026-10-21', // Date antérieure
        entryMode: 'total',
        total: 450,
        createdAt: '',
        updatedAt: ''
      }
    ];

    it('classe les joueurs par score décroissant et isole les membres archivés', () => {
      const leaderboard = calculateLeaderboard(members, results);

      expect(leaderboard[0].nickname).toBe('Alexandre');
      expect(leaderboard[0].total).toBe(1100);
      expect(leaderboard[0].isSynchronizedWithLatest).toBe(true);

      expect(leaderboard[1].nickname).toBe('Thomas');
      expect(leaderboard[1].total).toBe(900);
      expect(leaderboard[1].isSynchronizedWithLatest).toBe(true);

      // Nicolas est archivé, présent mais en fin de classement
      expect(leaderboard[2].nickname).toBe('Nicolas');
      expect(leaderboard[2].status).toBe('archived');
      expect(leaderboard[2].isSynchronizedWithLatest).toBe(false);
    });
  });

  describe('buildChartTimelineData', () => {
    const members: GroupMember[] = [
      {
        groupId: 'grp-1',
        userId: 'usr-1',
        nickname: 'Thomas',
        role: 'owner',
        status: 'active',
        joinedAt: '2026-10-20'
      },
      {
        groupId: 'grp-1',
        userId: 'usr-2',
        nickname: 'Nouveau Joueur',
        role: 'member',
        status: 'active',
        joinedAt: '2026-10-22' // A rejoint plus tard
      }
    ];

    const results: DailyResult[] = [
      { id: '1', groupId: 'grp-1', userId: 'usr-1', resultDate: '2026-10-20', entryMode: 'total', total: 500, createdAt: '', updatedAt: '' },
      { id: '2', groupId: 'grp-1', userId: 'usr-1', resultDate: '2026-10-21', entryMode: 'total', total: 550, createdAt: '', updatedAt: '' },
      { id: '3', groupId: 'grp-1', userId: 'usr-1', resultDate: '2026-10-22', entryMode: 'total', total: 600, createdAt: '', updatedAt: '' },
      // usr-2 commence son premier relevé au 2026-10-22
      { id: '4', groupId: 'grp-1', userId: 'usr-2', resultDate: '2026-10-22', entryMode: 'total', total: 800, createdAt: '', updatedAt: '' }
    ];

    it('laisse les valeurs à null avant le premier résultat d’un joueur (la courbe ne commence qu’à son arrivée)', () => {
      const { data } = buildChartTimelineData(members, results, 'all');

      // Date 2026-10-20 : usr-1 a 500, usr-2 a null (n'avait pas encore joué)
      const day1 = data.find((d) => d.date === '2026-10-20');
      expect(day1?.['usr-1']).toBe(500);
      expect(day1?.['usr-2']).toBeNull();

      // Date 2026-10-22 : usr-1 a 600, usr-2 a 800
      const day3 = data.find((d) => d.date === '2026-10-22');
      expect(day3?.['usr-1']).toBe(600);
      expect(day3?.['usr-2']).toBe(800);
    });

    it('ne crée aucune valeur fictive ou interpolée pour les jours sans relevé', () => {
      // usr-1 n'a pas de relevé au 2026-10-23 alors que usr-2 en a un
      const extendedResults: DailyResult[] = [
        ...results,
        { id: '5', groupId: 'grp-1', userId: 'usr-2', resultDate: '2026-10-23', entryMode: 'total', total: 850, createdAt: '', updatedAt: '' }
      ];

      const { data } = buildChartTimelineData(members, extendedResults, 'all');
      const day4 = data.find((d) => d.date === '2026-10-23');

      expect(day4?.['usr-2']).toBe(850);
      expect(day4?.['usr-1']).toBeNull(); // Doit être strictement null !
    });
  });
});
