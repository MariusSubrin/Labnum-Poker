/**
 * Utilitaires cryptographiques pour la génération et le hashage de jetons d'invitation.
 * Compatible navigateur moderne (Web Crypto API) et environnement de test Node.js.
 */

/**
 * Calcule le hash SHA-256 hexadécimal d'une chaîne
 */
export async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text.trim());

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback si crypto.subtle n'est pas disponible (anciens environnements)
  throw new Error('Web Crypto API (crypto.subtle) non disponible.');
}

/**
 * Génère un code d'invitation lisible et sécurisé (ex: PK-8X42-KM9)
 */
export function generateReadableInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclut 0, O, 1, I pour éviter toute confusion visuelle
  const randomBytes = new Uint8Array(8);

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomBytes);
  } else {
    for (let i = 0; i < 8; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
  }

  let code = 'PK-';
  for (let i = 0; i < 4; i++) {
    code += chars[randomBytes[i] % chars.length];
  }
  code += '-';
  for (let i = 4; i < 8; i++) {
    code += chars[randomBytes[i] % chars.length];
  }

  return code;
}
