import { ChipCounts, CHIP_VALUES } from '../types';

export const MAX_REASONABLE_CHIP_COUNT = 100_000;
export const MAX_REASONABLE_TOTAL = 10_000_000;

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Valide qu'une quantité de jetons est un entier positif ou nul
 */
export function validateChipQuantity(quantity: unknown): ValidationResult {
  if (typeof quantity !== 'number' || !Number.isFinite(quantity)) {
    return { isValid: false, error: 'La quantité doit être un nombre valide.' };
  }
  if (!Number.isInteger(quantity)) {
    return { isValid: false, error: 'Les décimales ne sont pas autorisées pour les jetons.' };
  }
  if (quantity < 0) {
    return { isValid: false, error: 'La quantité ne peut pas être négative.' };
  }
  if (quantity > MAX_REASONABLE_CHIP_COUNT) {
    return { isValid: false, error: `La quantité ne peut excéder ${MAX_REASONABLE_CHIP_COUNT.toLocaleString('fr-FR')}.` };
  }
  return { isValid: true };
}

/**
 * Valide un total direct
 */
export function validateDirectTotal(total: unknown): ValidationResult {
  if (typeof total !== 'number' || !Number.isFinite(total)) {
    return { isValid: false, error: 'Le total doit être un nombre valide.' };
  }
  if (!Number.isInteger(total)) {
    return { isValid: false, error: 'Le total doit être un entier.' };
  }
  if (total < 0) {
    return { isValid: false, error: 'Le total ne peut pas être négatif.' };
  }
  if (total > MAX_REASONABLE_TOTAL) {
    return { isValid: false, error: `Le total ne peut excéder ${MAX_REASONABLE_TOTAL.toLocaleString('fr-FR')}.` };
  }
  return { isValid: true };
}

/**
 * Calcule le total en mode détaillé à partir des quantités de chaque couleur
 */
export function calculateDetailedTotal(counts: ChipCounts): number {
  const blue = counts.blue || 0;
  const red = counts.red || 0;
  const black = counts.black || 0;
  const green = counts.green || 0;
  const white = counts.white || 0;

  return (
    blue * CHIP_VALUES.blue +
    red * CHIP_VALUES.red +
    black * CHIP_VALUES.black +
    green * CHIP_VALUES.green +
    white * CHIP_VALUES.white
  );
}

/**
 * Calcule la variation par rapport au relevé précédent
 */
export function calculateVariation(currentTotal: number, previousTotal: number | null | undefined): number | null {
  if (previousTotal === null || previousTotal === undefined) {
    return null;
  }
  return currentTotal - previousTotal;
}

/**
 * Formate un nombre de jetons avec séparateur de milliers
 */
export function formatChips(amount: number): string {
  return amount.toLocaleString('fr-FR');
}

/**
 * Formate une variation avec signe (+ / -)
 */
export function formatVariation(variation: number | null): string {
  if (variation === null || variation === undefined) {
    return 'Premier relevé';
  }
  if (variation > 0) {
    return `+${variation.toLocaleString('fr-FR')}`;
  }
  return variation.toLocaleString('fr-FR');
}
