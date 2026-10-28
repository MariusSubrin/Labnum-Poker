import { describe, it, expect } from 'vitest';
import {
  getTodayDateString,
  formatDateFr,
  formatFullDateFr,
  isValidDateString,
  DEFAULT_TIMEZONE
} from './date';

describe('date utils - Gestion des dates et fuseaux horaires', () => {
  it('fournit par défaut le fuseau Europe/Paris', () => {
    expect(DEFAULT_TIMEZONE).toBe('Europe/Paris');
  });

  it('génère la date d’aujourd’hui au format ISO YYYY-MM-DD', () => {
    const today = getTodayDateString();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(isValidDateString(today)).toBe(true);
  });

  it('formate correctement une date ISO en JJ/MM/AAAA', () => {
    expect(formatDateFr('2026-10-28')).toBe('28/10/2026');
    expect(formatDateFr('2026-01-05')).toBe('05/01/2026');
    expect(formatDateFr('')).toBe('');
  });

  it('formate la date complète en français', () => {
    const formatted = formatFullDateFr('2026-10-28');
    // Le 28 octobre 2026 est un mercredi
    expect(formatted.toLowerCase()).toContain('mercredi');
    expect(formatted).toContain('28');
    expect(formatted.toLowerCase()).toContain('octobre');
    expect(formatted).toContain('2026');
  });

  it('valide rigoureusement les chaînes de dates calendaires', () => {
    expect(isValidDateString('2026-10-28')).toBe(true);
    expect(isValidDateString('2026-02-29')).toBe(false); // 2026 n'est pas bissextile
    expect(isValidDateString('2024-02-29')).toBe(true);  // 2024 est bissextile
    expect(isValidDateString('2026-13-01')).toBe(false); // Mois 13 invalide
    expect(isValidDateString('2026-04-31')).toBe(false); // 31 avril n'existe pas
    expect(isValidDateString('invalide')).toBe(false);
  });
});
