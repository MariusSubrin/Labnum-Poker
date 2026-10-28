import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { Card } from '../common/Card';
import { GroupMember, DailyResult } from '../../types';
import {
  TimeFilter,
  buildChartTimelineData
} from '../../utils/statistics';
import { formatChips } from '../../utils/chipCalculations';
import { formatDateFr } from '../../utils/date';
import { Eye, EyeOff, User } from 'lucide-react';

export interface PokerTrendChartProps {
  members: GroupMember[];
  results: DailyResult[];
  currentUserId?: string;
}

// Palette de couleurs noble et distincte pour les lignes de chaque joueur
const PLAYER_LINE_COLORS = [
  '#dfba73', // Or patiné (Joueur principal)
  '#10b981', // Émeraude
  '#3b82f6', // Bleu saphir
  '#f43f5e', // Rubis
  '#a855f7', // Améthyste
  '#06b6d4', // Cyan
  '#f97316', // Cuivre
  '#e2e8f0'  // Platine
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number | null;
    color: string;
    dataKey: string;
  }>;
  label?: string;
  membersMap: Map<string, GroupMember>;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, membersMap }) => {
  if (!active || !payload || payload.length === 0) return null;

  // Filtrer les valeurs non nulles sur ce jour
  const validEntries = payload.filter((p) => typeof p.value === 'number');
  if (validEntries.length === 0) return null;

  return (
    <div className="p-3 rounded-xl bg-[#08140e]/95 backdrop-blur-md border border-[#c5a059]/40 shadow-xl shadow-black/80 text-xs space-y-2 min-w-[160px]">
      <div className="font-mono font-bold text-slate-300 border-b border-[#1b3d2c] pb-1.5 flex justify-between">
        <span>Session</span>
        <span className="text-[#dfba73]">{label ? formatDateFr(label) : ''}</span>
      </div>

      <div className="space-y-1.5">
        {validEntries.map((entry) => {
          const member = membersMap.get(entry.dataKey);
          const name = member?.nickname || entry.name;

          return (
            <div key={entry.dataKey} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-slate-200 font-medium truncate max-w-[100px]">{name}</span>
              </div>
              <span className="font-serif font-bold text-white">
                {formatChips(entry.value as number)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const PokerTrendChart: React.FC<PokerTrendChartProps> = ({
  members,
  results,
  currentUserId
}) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('30d');
  const [soloUserId, setSoloUserId] = useState<string | null>(null);

  // Indexation des membres par ID
  const membersMap = useMemo(() => {
    const map = new Map<string, GroupMember>();
    for (const m of members) map.set(m.userId, m);
    return map;
  }, [members]);

  // Joueurs visibles (par défaut tous sauf archivés, ou solo si actif)
  const [hiddenUsers, setHiddenUsers] = useState<Set<string>>(new Set());

  const toggleUserVisibility = (userId: string) => {
    if (soloUserId) {
      setSoloUserId(null);
    }
    setHiddenUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleSoloUser = (userId: string) => {
    if (soloUserId === userId) {
      setSoloUserId(null);
    } else {
      setSoloUserId(userId);
    }
  };

  // Préparation des séries temporelles (sans extrapolation de valeurs fictives !)
  const { data: chartData } = useMemo(
    () => buildChartTimelineData(members, results, timeFilter),
    [members, results, timeFilter]
  );

  // Attribution des couleurs de lignes
  const playerColors = useMemo(() => {
    const map = new Map<string, string>();
    let colorIdx = 1;

    for (const m of members) {
      if (m.userId === currentUserId) {
        map.set(m.userId, PLAYER_LINE_COLORS[0]); // Toujours l'or pour l'utilisateur connecté
      } else {
        map.set(m.userId, PLAYER_LINE_COLORS[colorIdx % PLAYER_LINE_COLORS.length]);
        colorIdx++;
      }
    }
    return map;
  }, [members, currentUserId]);

  const activeLines = members.filter((m) => {
    if (soloUserId) return m.userId === soloUserId;
    return !hiddenUsers.has(m.userId);
  });

  return (
    <Card className="bg-[#0b1a13] border-[#183525] space-y-4">
      {/* En-tête du graphique avec période */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#183525]">
        <div>
          <span className="font-serif font-bold text-sm text-[#f5ebd7] tracking-wider uppercase block">
            Évolution Collective
          </span>
          <p className="text-xs text-slate-400 mt-0.5">
            Historique réel des jetons au fil des sessions
          </p>
        </div>

        {/* Sélecteurs de période 7j, 30j, Tout */}
        <div className="inline-flex rounded-xl bg-[#08140e] p-1 border border-[#1b3d2c] self-start sm:self-auto">
          {(['7d', '30d', 'all'] as TimeFilter[]).map((filter) => {
            const labels: Record<TimeFilter, string> = {
              '7d': '7 jours',
              '30d': '30 jours',
              all: 'Historique'
            };
            const isActive = timeFilter === filter;

            return (
              <button
                key={filter}
                type="button"
                onClick={() => setTimeFilter(filter)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[#1b3d2c] text-[#dfba73] shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {labels[filter]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filtres de sélection / masquage des joueurs */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[11px] text-slate-400 mr-1 flex items-center gap-1 font-medium">
          <User className="w-3 h-3 text-slate-400" /> Joueurs :
        </span>

        {members.map((member) => {
          const color = playerColors.get(member.userId) || '#dfba73';
          const isSolo = soloUserId === member.userId;
          const isVisible = soloUserId ? isSolo : !hiddenUsers.has(member.userId);

          return (
            <div
              key={member.userId}
              className={`inline-flex items-center rounded-lg border text-xs transition-all ${
                isVisible
                  ? 'bg-[#08140e] border-[#1b3d2c] text-slate-200'
                  : 'bg-[#060e09] border-transparent text-slate-500 opacity-60'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleUserVisibility(member.userId)}
                title={isVisible ? `Masquer ${member.nickname}` : `Afficher ${member.nickname}`}
                className="flex items-center gap-1.5 px-2.5 py-1"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: isVisible ? color : '#475569' }}
                />
                <span className="font-semibold text-[11px]">{member.nickname}</span>
                {isVisible ? (
                  <Eye className="w-3 h-3 text-slate-400 ml-0.5" />
                ) : (
                  <EyeOff className="w-3 h-3 text-slate-500 ml-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSoloUser(member.userId)}
                title={isSolo ? 'Afficher tous les joueurs' : `Isoler ${member.nickname}`}
                className={`px-1.5 py-1 border-l border-[#1b3d2c] text-[10px] font-bold ${
                  isSolo ? 'text-[#dfba73] bg-[#1b3d2c]' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Seul
              </button>
            </div>
          );
        })}
      </div>

      {/* Zone du graphique Recharts */}
      <div className="h-64 sm:h-72 w-full pt-3">
        {chartData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400">
            <p className="text-sm font-semibold">Aucun relevé dans cette période</p>
            <p className="text-xs text-slate-400 mt-1">
              Enregistrez vos stocks de jetons pour tracer les courbes de progression.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#162c20" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#64748b"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={{ stroke: '#1c3527' }}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={{ stroke: '#1c3527' }}
                tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val)}
              />
              <Tooltip
                content={<CustomTooltip membersMap={membersMap} />}
                cursor={{ stroke: '#c5a059', strokeWidth: 1, strokeDasharray: '4 4' }}
              />

              {activeLines.map((member) => {
                const color = playerColors.get(member.userId) || '#dfba73';

                return (
                  <Line
                    key={member.userId}
                    type="monotone"
                    dataKey={member.userId}
                    name={member.nickname}
                    stroke={color}
                    strokeWidth={member.userId === currentUserId ? 3 : 2}
                    dot={{ r: 3, fill: color, strokeWidth: 1, stroke: '#08140e' }}
                    activeDot={{ r: 5, fill: color, stroke: '#f5ebd7', strokeWidth: 2 }}
                    // RÈGLE CLÉ : Ne JAMAIS connecter les points nuls ou inventer des valeurs fictives !
                    connectNulls={false}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};
