import { describe, it, expect } from 'vitest';
import {
  calculateDetailedTotal,
  calculateVariation,
  validateChipQuantity,
  validateDirectTotal,
  formatChips,
  formatVariation,
  MAX_REASONABLE_CHIP_COUNT,
  MAX_REASONABLE_TOTAL
} from './chipCalculations';
import { CHIP_VALUES } from '../types';

describe('chipCalculations - Règles métier de calcul des jetons', () => {
  describe('Valeurs fixes des jetons', () => {
    it('doit respecter strictement le barème officiel', () => {
      expect(CHIP_VALUES.blue).toBe(1);
      expect(CHIP_VALUES.red).toBe(5);
      expect(CHIP_VALUES.black).toBe(10);
      expect(CHIP_VALUES.green).toBe(25);
      expect(CHIP_VALUES.white).toBe(100);
    });
  });

  describe('calculateDetailedTotal', () => {
    it('calcule correctement pour une seule couleur isolée', () => {
      expect(calculateDetailedTotal({ blue: 10, red: 0, black: 0, green: 0, white: 0 })).toBe(10);
      expect(calculateDetailedTotal({ blue: 0, red: 10, black: 0, green: 0, white: 0 })).toBe(50);
      expect(calculateDetailedTotal({ blue: 0, red: 0, black: 10, green: 0, white: 0 })).toBe(100);
      expect(calculateDetailedTotal({ blue: 0, red: 0, black: 0, green: 10, white: 0 })).toBe(250);
      expect(calculateDetailedTotal({ blue: 0, red: 0, black: 0, green: 0, white: 10 })).toBe(1000);
    });

    it('calcule correctement une combinaison mixte réaliste', () => {
      // 12 bleus (12) + 8 rouges (40) + 15 noirs (150) + 6 verts (150) + 3 blancs (300) = 652
      const counts = { blue: 12, red: 8, black: 15, green: 6, white: 3 };
      expect(calculateDetailedTotal(counts)).toBe(652);
    });

    it('gère correctement des quantités nulles (tous à 0)', () => {
      const counts = { blue: 0, red: 0, black: 0, green: 0, white: 0 };
      expect(calculateDetailedTotal(counts)).toBe(0);
    });
  });

  describe('Validation des quantités de jetons (validateChipQuantity)', () => {
    it('accepte les entiers positifs et zéro', () => {
      expect(validateChipQuantity(0).isValid).toBe(true);
      expect(validateChipQuantity(42).isValid).toBe(true);
      expect(validateChipQuantity(MAX_REASONABLE_CHIP_COUNT).isValid).toBe(true);
    });

    it('refuse les valeurs négatives', () => {
      const res = validateChipQuantity(-1);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('négative');
    });

    it('refuse les décimales', () => {
      const res = validateChipQuantity(2.5);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('décimales');
    });

    it('refuse les types non numériques et NaN', () => {
      expect(validateChipQuantity('10').isValid).toBe(false);
      expect(validateChipQuantity(NaN).isValid).toBe(false);
      expect(validateChipQuantity(Infinity).isValid).toBe(false);
      expect(validateChipQuantity(null).isValid).toBe(false);
      expect(validateChipQuantity(undefined).isValid).toBe(false);
    });

    it('refuse les valeurs dépassant le plafond raisonnable', () => {
      const res = validateChipQuantity(MAX_REASONABLE_CHIP_COUNT + 1);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('excéder');
    });
  });

  describe('Validation du total direct (validateDirectTotal)', () => {
    it('accepte un entier positif ou nul', () => {
      expect(validateDirectTotal(0).isValid).toBe(true);
      expect(validateDirectTotal(1500).isValid).toBe(true);
      expect(validateDirectTotal(MAX_REASONABLE_TOTAL).isValid).toBe(true);
    });

    it('refuse les négatifs, décimales et non numériques', () => {
      expect(validateDirectTotal(-50).isValid).toBe(false);
      expect(validateDirectTotal(12.34).isValid).toBe(false);
      expect(validateDirectTotal('1500').isValid).toBe(false);
      expect(validateDirectTotal(NaN).isValid).toBe(false);
    });

    it('refuse les totaux démesurés', () => {
      expect(validateDirectTotal(MAX_REASONABLE_TOTAL + 1).isValid).toBe(false);
    });
  });

  describe('Calcul et formatage des variations', () => {
    it('calcule un gain (variation positive)', () => {
      expect(calculateVariation(750, 600)).toBe(150);
      expect(formatVariation(150)).toBe('+150');
    });

    it('calcule une perte (variation négative)', () => {
      expect(calculateVariation(400, 520)).toBe(-120);
      expect(formatVariation(-120)).toBe('-120');
    });

    it('calcule une stagnation (variation nulle)', () => {
      expect(calculateVariation(500, 500)).toBe(0);
      expect(formatVariation(0)).toBe('0');
    });

    it('gère le premier relevé sans historique précédent', () => {
      expect(calculateVariation(500, null)).toBeNull();
      expect(calculateVariation(500, undefined)).toBeNull();
      expect(formatVariation(null)).toBe('Premier relevé');
    });

    it('formate correctement les grands nombres avec séparateur', () => {
      expect(formatChips(12500)).toBe('12\u202F500'); // espace insécable standard fr-FR
    });
  });
});
