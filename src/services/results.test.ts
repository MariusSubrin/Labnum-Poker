import { describe, it, expect, beforeEach } from 'vitest';
import { saveDailyResult, getLatestResult, getLatestDetailedResult, getResultForDate } from './results';

describe('results service - Enregistrement et intégrité des relevés', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('refuse une date invalide', async () => {
    const res = await saveDailyResult({
      groupId: 'grp-test',
      userId: 'usr-test',
      resultDate: '2026-13-45', // Invalide
      entryMode: 'total',
      total: 500
    });
    expect(res.error).toContain('Date du relevé invalide');
  });

  it('calcule et valide rigoureusement le total en mode détaillé', async () => {
    const res = await saveDailyResult({
      groupId: 'grp-test',
      userId: 'usr-test',
      resultDate: '2026-10-28',
      entryMode: 'detailed',
      chipCounts: {
        blue: 10,   // 10
        red: 5,     // 25
        black: 8,   // 80
        green: 4,   // 100
        white: 2    // 200 => Total = 415
      }
    });

    expect(res.error).toBeUndefined();
    expect(res.result).toBeDefined();
    expect(res.result?.total).toBe(415);
    expect(res.result?.entryMode).toBe('detailed');
    expect(res.result?.chipCounts?.blue).toBe(10);
  });

  it('refuse les quantités négatives ou décimales en mode détaillé', async () => {
    const resNegative = await saveDailyResult({
      groupId: 'grp-test',
      userId: 'usr-test',
      resultDate: '2026-10-28',
      entryMode: 'detailed',
      chipCounts: { blue: -1, red: 0, black: 0, green: 0, white: 0 }
    });
    expect(resNegative.error).toContain('négative');

    const resDecimal = await saveDailyResult({
      groupId: 'grp-test',
      userId: 'usr-test',
      resultDate: '2026-10-28',
      entryMode: 'detailed',
      chipCounts: { blue: 2.5, red: 0, black: 0, green: 0, white: 0 }
    });
    expect(resDecimal.error).toContain('décimales');
  });

  it('enregistre correctement le mode total direct avec quantités nulles', async () => {
    const res = await saveDailyResult({
      groupId: 'grp-test',
      userId: 'usr-test',
      resultDate: '2026-10-28',
      entryMode: 'total',
      total: 750
    });

    expect(res.error).toBeUndefined();
    expect(res.result?.total).toBe(750);
    expect(res.result?.entryMode).toBe('total');
    expect(res.result?.chipCounts).toBeNull();
  });

  it('modifie le relevé existant lors d’une seconde saisie le même jour sans doublon (Upsert)', async () => {
    // 1ère saisie
    const first = await saveDailyResult({
      groupId: 'grp-test',
      userId: 'usr-test',
      resultDate: '2026-10-28',
      entryMode: 'total',
      total: 500
    });
    expect(first.isUpdate).toBe(false);

    // 2ème saisie le même jour pour le même joueur
    const second = await saveDailyResult({
      groupId: 'grp-test',
      userId: 'usr-test',
      resultDate: '2026-10-28',
      entryMode: 'total',
      total: 620
    });
    expect(second.isUpdate).toBe(true);

    // Vérification du résultat actif pour cette date
    const current = await getResultForDate('grp-test', 'usr-test', '2026-10-28');
    expect(current?.total).toBe(620);
  });

  it('permet de retrouver le dernier relevé pour le préremplissage', async () => {
    // Relevé détaillé au 26/10
    await saveDailyResult({
      groupId: 'grp-test',
      userId: 'usr-test',
      resultDate: '2026-10-26',
      entryMode: 'detailed',
      chipCounts: { blue: 12, red: 6, black: 4, green: 2, white: 1 }
    });

    // Relevé total direct au 27/10
    await saveDailyResult({
      groupId: 'grp-test',
      userId: 'usr-test',
      resultDate: '2026-10-27',
      entryMode: 'total',
      total: 600
    });

    // Le dernier résultat tout mode confondu est celui du 27/10
    const latestAny = await getLatestResult('grp-test', 'usr-test');
    expect(latestAny?.resultDate).toBe('2026-10-27');
    expect(latestAny?.total).toBe(600);

    // Le dernier résultat détaillé pour préremplir les jetons est celui du 26/10
    const latestDetailed = await getLatestDetailedResult('grp-test', 'usr-test');
    expect(latestDetailed?.resultDate).toBe('2026-10-26');
    expect(latestDetailed?.chipCounts?.blue).toBe(12);
  });
});
