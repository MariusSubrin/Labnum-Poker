/**
 * Utilitaires pour la gestion des dates et des fuseaux horaires (Europe/Paris par défaut).
 * Garantit l'absence de décalage calendaire entre le client et PostgreSQL (type DATE).
 */

export const DEFAULT_TIMEZONE = 'Europe/Paris';

/**
 * Retourne la date courante au format ISO 'YYYY-MM-DD' selon le fuseau horaire spécifié.
 */
export function getTodayDateString(timezone: string = DEFAULT_TIMEZONE): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    // en-CA produit le format standardisé ISO YYYY-MM-DD
    return formatter.format(new Date());
  } catch {
    // Fallback standard si fuseau invalide
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

/**
 * Formate une date 'YYYY-MM-DD' au format français 'JJ/MM/AAAA'
 */
export function formatDateFr(dateStr: string): string {
  if (!dateStr || !dateStr.includes('-')) {
    return dateStr;
  }
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

/**
 * Formate une date avec nom du jour en français (ex: "Mercredi 28 octobre 2026")
 */
export function formatFullDateFr(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;

  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Valide qu'une chaîne de date est au format YYYY-MM-DD et représente un jour réel
 */
export function isValidDateString(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const d = new Date(year, month - 1, day);
  return (
    d.getFullYear() === year &&
    d.getMonth() === month - 1 &&
    d.getDate() === day
  );
}
