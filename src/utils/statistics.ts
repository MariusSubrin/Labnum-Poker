import { DailyResult, GroupMember } from '../types';
import { formatDateFr } from './date';

export type TimeFilter = '7d' | '30d' | 'all';

export interface PlayerStats {
  currentTotal: number;
  previousTotal: number | null;
  variation: number | null;
  personalBest: {
    total: number;
    date: string;
  } | null;
  bestPositiveDiff: {
    amount: number;
    date: string;
  } | null;
  worstNegativeDiff: {
    amount: number;
    date: string;
  } | null;
  totalEntries: number;
  lastRecordDate: string | null;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  nickname: string;
  role: 'owner' | 'member';
  status: 'active' | 'archived';
  total: number;
  variation: number | null;
  lastRecordDate: string | null;
  isSynchronizedWithLatest: boolean;
  daysBehind?: number;
}

export interface ChartDataPoint {
  date: string;
  label: string;
  [userId: string]: number | string | null | undefined;
}

/**
 * Calcule à la volée les statistiques personnelles d'un joueur à partir de ses relevés
 */
export function calculatePlayerStats(userResults: DailyResult[]): PlayerStats {
  if (!userResults || userResults.length === 0) {
    return {
      currentTotal: 0,
      previousTotal: null,
      variation: null,
      personalBest: null,
      bestPositiveDiff: null,
      worstNegativeDiff: null,
      totalEntries: 0,
      lastRecordDate: null
    };
  }

  // Tri chronologique croissant (du plus ancien au plus récent)
  const sorted = [...userResults].sort((a, b) => a.resultDate.localeCompare(b.resultDate));

  const latest = sorted[sorted.length - 1];
  const previous = sorted.length >= 2 ? sorted[sorted.length - 2] : null;
  const variation = previous ? latest.total - previous.total : null;

  // Calcul du record personnel
  let personalBest = { total: sorted[0].total, date: sorted[0].resultDate };
  for (const r of sorted) {
    if (r.total > personalBest.total) {
      personalBest = { total: r.total, date: r.resultDate };
    }
  }

  // Calcul de la meilleure hausse et plus forte baisse consécutives
  let bestPositiveDiff: { amount: number; date: string } | null = null;
  let worstNegativeDiff: { amount: number; date: string } | null = null;

  for (let i = 1; i < sorted.length; i++) {
    const diff = sorted[i].total - sorted[i - 1].total;
    if (diff > 0) {
      if (!bestPositiveDiff || diff > bestPositiveDiff.amount) {
        bestPositiveDiff = { amount: diff, date: sorted[i].resultDate };
      }
    } else if (diff < 0) {
      if (!worstNegativeDiff || diff < worstNegativeDiff.amount) {
        worstNegativeDiff = { amount: diff, date: sorted[i].resultDate };
      }
    }
  }

  return {
    currentTotal: latest.total,
    previousTotal: previous ? previous.total : null,
    variation,
    personalBest,
    bestPositiveDiff,
    worstNegativeDiff,
    totalEntries: sorted.length,
    lastRecordDate: latest.resultDate
  };
}

/**
 * Calcule le classement complet de la table
 * Rend explicite toute différence de synchronisation de date entre les joueurs
 */
export function calculateLeaderboard(
  members: GroupMember[],
  allResults: DailyResult[]
): LeaderboardEntry[] {
  // Regroupement des résultats par joueur
  const resultsByUser = new Map<string, DailyResult[]>();
  for (const r of allResults) {
    const list = resultsByUser.get(r.userId) || [];
    list.push(r);
    resultsByUser.set(r.userId, list);
  }

  // Trouver la date de relevé la plus récente globale de la table
  let latestTableDate: string | null = null;
  for (const r of allResults) {
    if (!latestTableDate || r.resultDate > latestTableDate) {
      latestTableDate = r.resultDate;
    }
  }

  // Construction des entrées pour les membres
  const entries: Omit<LeaderboardEntry, 'rank'>[] = members.map((member) => {
    const userResults = resultsByUser.get(member.userId) || [];
    const stats = calculatePlayerStats(userResults);

    const isSynchronized =
      !latestTableDate || !stats.lastRecordDate
        ? true
        : stats.lastRecordDate === latestTableDate;

    return {
      userId: member.userId,
      nickname: member.nickname,
      role: member.role,
      status: member.status,
      total: stats.currentTotal,
      variation: stats.variation,
      lastRecordDate: stats.lastRecordDate,
      isSynchronizedWithLatest: isSynchronized
    };
  });

  // Tri par total décroissant (les joueurs sans relevé terminent en fin de tableau)
  entries.sort((a, b) => {
    // Les membres actifs en priorité
    if (a.status === 'active' && b.status === 'archived') return -1;
    if (a.status === 'archived' && b.status === 'active') return 1;
    return b.total - a.total;
  });

  return entries.map((entry, index) => ({
    ...entry,
    rank: index + 1
  }));
}

/**
 * Construit la série de données temporelles pour le graphique Recharts
 * RÈGLES CRUCIALES :
 * 1. Aucune valeur interpolée/fictive : si un joueur n'a pas joué un jour J, sa valeur est null.
 * 2. La courbe d'un joueur ne commence qu'à partir de sa première date de relevé réelle.
 */
export function buildChartTimelineData(
  members: GroupMember[],
  allResults: DailyResult[],
  timeFilter: TimeFilter
): { data: ChartDataPoint[]; activeDates: string[] } {
  if (allResults.length === 0) {
    return { data: [], activeDates: [] };
  }

  // 1. Lister toutes les dates réelles où au moins un résultat existe
  const uniqueDates = Array.from(new Set(allResults.map((r) => r.resultDate))).sort();

  if (uniqueDates.length === 0) {
    return { data: [], activeDates: [] };
  }

  // 2. Filtrer selon la période choisie ('7d', '30d', 'all')
  const latestDate = new Date(uniqueDates[uniqueDates.length - 1]);
  let filteredDates = uniqueDates;

  if (timeFilter === '7d') {
    const cutoff = new Date(latestDate);
    cutoff.setDate(cutoff.getDate() - 7);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    filteredDates = uniqueDates.filter((d) => d >= cutoffStr);
  } else if (timeFilter === '30d') {
    const cutoff = new Date(latestDate);
    cutoff.setDate(cutoff.getDate() - 30);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    filteredDates = uniqueDates.filter((d) => d >= cutoffStr);
  }

  // 3. Déterminer la date de premier résultat de chaque joueur
  const firstRecordByUser = new Map<string, string>();
  for (const r of allResults) {
    const existing = firstRecordByUser.get(r.userId);
    if (!existing || r.resultDate < existing) {
      firstRecordByUser.set(r.userId, r.resultDate);
    }
  }

  // 4. Indexer les résultats par "userId_date"
  const resultMap = new Map<string, number>();
  for (const r of allResults) {
    resultMap.set(`${r.userId}_${r.resultDate}`, r.total);
  }

  // 5. Générer les points sans invention de données
  const data: ChartDataPoint[] = filteredDates.map((dateStr) => {
    const point: ChartDataPoint = {
      date: dateStr,
      label: formatDateFr(dateStr).slice(0, 5) // "JJ/MM"
    };

    for (const member of members) {
      const firstDate = firstRecordByUser.get(member.userId);
      // Si la date du point est avant le premier relevé du joueur, pas de point (la courbe n'existe pas encore)
      if (!firstDate || dateStr < firstDate) {
        point[member.userId] = null;
        continue;
      }

      const key = `${member.userId}_${dateStr}`;
      const totalOnDate = resultMap.get(key);
      // Si le joueur n'a pas de relevé ce jour-là, valeur null (pas d'interpolation trompeuse)
      point[member.userId] = totalOnDate !== undefined ? totalOnDate : null;
    }

    return point;
  });

  return { data, activeDates: filteredDates };
}
