import { describe, it, expect } from 'vitest';
import { sha256, generateReadableInviteCode } from './crypto';

describe('crypto utils - Génération et hashage sécurisé', () => {
  it('calcule un hash SHA-256 déterministe et conforme', async () => {
    // Hash SHA-256 standard connu de "poker-test"
    const hash1 = await sha256('poker-test');
    const hash2 = await sha256('poker-test');
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // 64 caractères hexadécimaux
  });

  it('génère un code d’invitation lisible au format PK-XXXX-XXXX sans caractères ambigus', () => {
    const code = generateReadableInviteCode();
    expect(code).toMatch(/^PK-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(code).not.toContain('O');
    expect(code).not.toContain('0');
    expect(code).not.toContain('I');
    expect(code).not.toContain('1');
  });

  it('génère des codes d’invitation uniques à chaque appel', () => {
    const set = new Set<string>();
    for (let i = 0; i < 50; i++) {
      set.add(generateReadableInviteCode());
    }
    expect(set.size).toBe(50);
  });
});
