export type ChipColor = 'blue' | 'red' | 'black' | 'green' | 'white';

export const CHIP_VALUES: Record<ChipColor, number> = {
  blue: 1,
  red: 5,
  black: 10,
  green: 25,
  white: 100
} as const;

export const CHIP_LABELS: Record<ChipColor, { name: string; colorClass: string; bgClass: string }> = {
  blue: { name: 'Bleu', colorClass: 'text-blue-400', bgClass: 'bg-blue-600' },
  red: { name: 'Rouge', colorClass: 'text-red-400', bgClass: 'bg-red-600' },
  black: { name: 'Noir', colorClass: 'text-slate-300', bgClass: 'bg-slate-900 border border-slate-700' },
  green: { name: 'Vert', colorClass: 'text-emerald-400', bgClass: 'bg-emerald-600' },
  white: { name: 'Blanc', colorClass: 'text-slate-900', bgClass: 'bg-slate-100' }
};

export type EntryMode = 'detailed' | 'total';

export interface ChipCounts {
  blue: number;
  red: number;
  black: number;
  green: number;
  white: number;
}

export interface DailyResult {
  id: string;
  groupId: string;
  userId: string;
  resultDate: string; // YYYY-MM-DD
  entryMode: EntryMode;
  total: number;
  chipCounts?: ChipCounts | null;
  createdAt: string;
  updatedAt: string;
}

export type MemberRole = 'owner' | 'member';
export type MemberStatus = 'active' | 'archived';

export interface GroupMember {
  groupId: string;
  userId: string;
  nickname: string;
  role: MemberRole;
  status: MemberStatus;
  joinedAt: string;
  archivedAt?: string | null;
}

export interface Group {
  id: string;
  name: string;
  ownerUserId: string;
  timezone: string;
  createdAt: string;
}

export interface UserProfile {
  userId: string;
  displayName: string;
  avatarKey?: string | null;
  createdAt: string;
}

export type NavigationTab = 'dashboard' | 'count' | 'players' | 'hands';
