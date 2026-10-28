import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DailyResult, EntryMode, ChipCounts } from '../types';
import {
  calculateDetailedTotal,
  validateChipQuantity,
  validateDirectTotal
} from '../utils/chipCalculations';
import { isValidDateString } from '../utils/date';

export interface SaveResultInput {
  groupId: string;
  userId: string;
  resultDate: string;
  entryMode: EntryMode;
  total?: number;
  chipCounts?: ChipCounts | null;
}

export interface SaveResultResponse {
  result?: DailyResult;
  error?: string;
  isUpdate?: boolean;
}

// Clé de stockage local pour le mode démo / aperçu hors-ligne
const LOCAL_STORAGE_RESULTS_KEY = 'poker_ledger_demo_results';

function getLocalResults(): DailyResult[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_RESULTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalResults(results: DailyResult[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_RESULTS_KEY, JSON.stringify(results));
  } catch {
    // Ignorer si localStorage plein ou indisponible
  }
}

/**
 * Enregistre ou met à jour le relevé quotidien d'un joueur
 * Garantit l'absence de doublons (un seul relevé par joueur/groupe/date)
 */
export async function saveDailyResult(input: SaveResultInput): Promise<SaveResultResponse> {
  // 1. Validation de la date
  if (!isValidDateString(input.resultDate)) {
    return { error: 'Date du relevé invalide. Le format attendu est AAAA-MM-JJ.' };
  }

  let finalTotal: number;
  let normalizedCounts: ChipCounts | null = null;

  // 2. Validation stricte selon le mode
  if (input.entryMode === 'detailed') {
    if (!input.chipCounts) {
      return { error: 'Les quantités de jetons par couleur sont obligatoires en mode détaillé.' };
    }

    // Validation arithmétique de chaque couleur
    const colors: (keyof ChipCounts)[] = ['blue', 'red', 'black', 'green', 'white'];
    for (const c of colors) {
      const val = input.chipCounts[c];
      const valid = validateChipQuantity(val);
      if (!valid.isValid) {
        return { error: `Jeton ${c} : ${valid.error}` };
      }
    }

    normalizedCounts = {
      blue: Math.floor(input.chipCounts.blue),
      red: Math.floor(input.chipCounts.red),
      black: Math.floor(input.chipCounts.black),
      green: Math.floor(input.chipCounts.green),
      white: Math.floor(input.chipCounts.white)
    };

    // Calcul garanti côté service (ne fait jamais confiance à un total client transmis)
    finalTotal = calculateDetailedTotal(normalizedCounts);
  } else {
    // Mode total direct
    if (typeof input.total !== 'number') {
      return { error: 'Le montant total est obligatoire en mode direct.' };
    }
    const valid = validateDirectTotal(input.total);
    if (!valid.isValid) {
      return { error: valid.error };
    }
    finalTotal = Math.floor(input.total);
    normalizedCounts = null;
  }

  // 3. Persistance dans Supabase (ou fallback local démo)
  if (!isSupabaseConfigured()) {
    // Fallback mode aperçu
    const currentResults = getLocalResults();
    const existingIndex = currentResults.findIndex(
      (r) => r.groupId === input.groupId && r.userId === input.userId && r.resultDate === input.resultDate
    );

    const now = new Date().toISOString();
    const newRecord: DailyResult = {
      id: existingIndex >= 0 ? currentResults[existingIndex].id : `local-${Date.now()}`,
      groupId: input.groupId,
      userId: input.userId,
      resultDate: input.resultDate,
      entryMode: input.entryMode,
      total: finalTotal,
      chipCounts: normalizedCounts,
      createdAt: existingIndex >= 0 ? currentResults[existingIndex].createdAt : now,
      updatedAt: now
    };

    if (existingIndex >= 0) {
      currentResults[existingIndex] = newRecord;
    } else {
      currentResults.push(newRecord);
    }
    saveLocalResults(currentResults);

    return { result: newRecord, isUpdate: existingIndex >= 0 };
  }

  // 4. Exécution UPSERT dans PostgreSQL
  const { data, error } = await supabase
    .from('daily_results')
    .upsert(
      {
        group_id: input.groupId,
        user_id: input.userId,
        result_date: input.resultDate,
        entry_mode: input.entryMode,
        total: finalTotal,
        blue_count: normalizedCounts?.blue ?? null,
        red_count: normalizedCounts?.red ?? null,
        black_count: normalizedCounts?.black ?? null,
        green_count: normalizedCounts?.green ?? null,
        white_count: normalizedCounts?.white ?? null
      },
      { onConflict: 'group_id,user_id,result_date' }
    )
    .select()
    .single();

  if (error || !data) {
    return { error: error?.message || 'Erreur lors de l’enregistrement du relevé.' };
  }

  return {
    result: {
      id: data.id,
      groupId: data.group_id,
      userId: data.user_id,
      resultDate: data.result_date,
      entryMode: data.entry_mode as EntryMode,
      total: data.total,
      chipCounts:
        data.entry_mode === 'detailed'
          ? {
              blue: data.blue_count ?? 0,
              red: data.red_count ?? 0,
              black: data.black_count ?? 0,
              green: data.green_count ?? 0,
              white: data.white_count ?? 0
            }
          : null,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  };
}

/**
 * Récupère le dernier résultat connu pour un joueur donné
 */
export async function getLatestResult(groupId: string, userId: string): Promise<DailyResult | null> {
  if (!isSupabaseConfigured()) {
    const list = getLocalResults().filter((r) => r.groupId === groupId && r.userId === userId);
    list.sort((a, b) => b.resultDate.localeCompare(a.resultDate));
    return list[0] || null;
  }

  const { data, error } = await supabase
    .from('daily_results')
    .select('*')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .order('result_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    groupId: data.group_id,
    userId: data.user_id,
    resultDate: data.result_date,
    entryMode: data.entry_mode as EntryMode,
    total: data.total,
    chipCounts:
      data.entry_mode === 'detailed'
        ? {
            blue: data.blue_count ?? 0,
            red: data.red_count ?? 0,
            black: data.black_count ?? 0,
            green: data.green_count ?? 0,
            white: data.white_count ?? 0
          }
        : null,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

/**
 * Récupère le dernier relevé DÉTAILLÉ d'un joueur pour le préremplissage des quantités
 */
export async function getLatestDetailedResult(groupId: string, userId: string): Promise<DailyResult | null> {
  if (!isSupabaseConfigured()) {
    const list = getLocalResults().filter(
      (r) => r.groupId === groupId && r.userId === userId && r.entryMode === 'detailed'
    );
    list.sort((a, b) => b.resultDate.localeCompare(a.resultDate));
    return list[0] || null;
  }

  const { data, error } = await supabase
    .from('daily_results')
    .select('*')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .eq('entry_mode', 'detailed')
    .order('result_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    groupId: data.group_id,
    userId: data.user_id,
    resultDate: data.result_date,
    entryMode: 'detailed',
    total: data.total,
    chipCounts: {
      blue: data.blue_count ?? 0,
      red: data.red_count ?? 0,
      black: data.black_count ?? 0,
      green: data.green_count ?? 0,
      white: data.white_count ?? 0
    },
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

/**
 * Vérifie si un résultat existe déjà pour un joueur à une date donnée
 */
export async function getResultForDate(
  groupId: string,
  userId: string,
  resultDate: string
): Promise<DailyResult | null> {
  if (!isSupabaseConfigured()) {
    const found = getLocalResults().find(
      (r) => r.groupId === groupId && r.userId === userId && r.resultDate === resultDate
    );
    return found || null;
  }

  const { data, error } = await supabase
    .from('daily_results')
    .select('*')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .eq('result_date', resultDate)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    groupId: data.group_id,
    userId: data.user_id,
    resultDate: data.result_date,
    entryMode: data.entry_mode as EntryMode,
    total: data.total,
    chipCounts:
      data.entry_mode === 'detailed'
        ? {
            blue: data.blue_count ?? 0,
            red: data.red_count ?? 0,
            black: data.black_count ?? 0,
            green: data.green_count ?? 0,
            white: data.white_count ?? 0
          }
        : null,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}
