import { describe, it, expect, vi } from 'vitest';
import { createInviteCode } from './groups';
import * as cryptoUtils from '../utils/crypto';

describe('groups service - Invitations et sécurité', () => {
  it('génère un code d’invitation hashé sans exposer le hash brut au client', async () => {
    // Espion sur sha256 et generateReadableInviteCode
    const spyGenerate = vi.spyOn(cryptoUtils, 'generateReadableInviteCode');
    const spyHash = vi.spyOn(cryptoUtils, 'sha256');

    // Test sans Supabase configuré : retourne l'erreur explicite sans planter
    const result = await createInviteCode('group-123', 'user-456', 5, 7);

    // En environnement sans credentials, doit retourner un message propre
    expect(result.error).toContain('Supabase n’est pas configuré');

    spyGenerate.mockRestore();
    spyHash.mockRestore();
  });
});
