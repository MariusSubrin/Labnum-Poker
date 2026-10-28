import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { PokerChip } from '../common/PokerChip';
import { ChipColor, ChipCounts, EntryMode, DailyResult } from '../../types';
import {
  calculateDetailedTotal,
  calculateVariation,
  formatChips,
  formatVariation
} from '../../utils/chipCalculations';
import {
  getTodayDateString,
  formatDateFr,
  formatFullDateFr,
  DEFAULT_TIMEZONE
} from '../../utils/date';
import {
  saveDailyResult,
  getLatestResult,
  getLatestDetailedResult,
  getResultForDate
} from '../../services/results';
import {
  Plus,
  Minus,
  RotateCcw,
  History,
  Calendar,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  X
} from 'lucide-react';

export interface ChipEntryFormProps {
  groupId: string;
  userId: string;
  timezone?: string;
  onSaved?: (result: DailyResult) => void;
}

const EMPTY_CHIPS: ChipCounts = {
  blue: 0,
  red: 0,
  black: 0,
  green: 0,
  white: 0
};

const CHIP_DETAILS: { color: ChipColor; label: string; value: number }[] = [
  { color: 'blue', label: 'Bleu', value: 1 },
  { color: 'red', label: 'Rouge', value: 5 },
  { color: 'black', label: 'Noir', value: 10 },
  { color: 'green', label: 'Vert', value: 25 },
  { color: 'white', label: 'Blanc', value: 100 }
];

export const ChipEntryForm: React.FC<ChipEntryFormProps> = ({
  groupId,
  userId,
  timezone = DEFAULT_TIMEZONE,
  onSaved
}) => {
  const [resultDate, setResultDate] = useState(() => getTodayDateString(timezone));
  const [entryMode, setEntryMode] = useState<EntryMode>('detailed');
  const [chipCounts, setChipCounts] = useState<ChipCounts>(EMPTY_CHIPS);
  const [directTotal, setDirectTotal] = useState<number>(0);

  // Historique & Préremplissage
  const [previousResult, setPreviousResult] = useState<DailyResult | null>(null);
  const [lastDetailedResult, setLastDetailedResult] = useState<DailyResult | null>(null);
  const [existingDateResult, setExistingDateResult] = useState<DailyResult | null>(null);

  // États UI
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Chargement des résultats précédents et vérification d'existant
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const [latest, latestDetailed, forDate] = await Promise.all([
        getLatestResult(groupId, userId),
        getLatestDetailedResult(groupId, userId),
        getResultForDate(groupId, userId, resultDate)
      ]);

      if (!isMounted) return;

      setPreviousResult(latest);
      setLastDetailedResult(latestDetailed);
      setExistingDateResult(forDate);

      // Si un relevé existe déjà pour cette date, on le charge automatiquement
      if (forDate) {
        setEntryMode(forDate.entryMode);
        if (forDate.entryMode === 'detailed' && forDate.chipCounts) {
          setChipCounts(forDate.chipCounts);
        } else {
          setDirectTotal(forDate.total);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [groupId, userId, resultDate]);

  // Calcul du total actif et de la variation
  const calculatedTotal = entryMode === 'detailed' ? calculateDetailedTotal(chipCounts) : directTotal;
  const variation = calculateVariation(calculatedTotal, previousResult?.total);

  const handleChipChange = (color: ChipColor, delta: number) => {
    setChipCounts((prev) => ({
      ...prev,
      [color]: Math.max(0, prev[color] + delta)
    }));
  };

  const handleResetChips = () => {
    setChipCounts(EMPTY_CHIPS);
  };

  const handlePrefillLastDetailed = () => {
    if (lastDetailedResult?.chipCounts) {
      setChipCounts(lastDetailedResult.chipCounts);
      setEntryMode('detailed');
    }
  };

  const handleOpenConfirm = () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (entryMode === 'detailed' && calculatedTotal === 0) {
      // Autoriser 0 mais demander confirmation si tous les jetons sont à 0
    }
    if (entryMode === 'total' && directTotal < 0) {
      setErrorMessage('Le total direct ne peut pas être négatif.');
      return;
    }

    setIsConfirmOpen(true);
  };

  const handleExecuteSave = async () => {
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const res = await saveDailyResult({
        groupId,
        userId,
        resultDate,
        entryMode,
        total: entryMode === 'total' ? directTotal : undefined,
        chipCounts: entryMode === 'detailed' ? chipCounts : null
      });

      if (res.error) {
        setErrorMessage(res.error);
        setIsConfirmOpen(false);
      } else if (res.result) {
        setIsConfirmOpen(false);
        setSuccessMessage(
          res.isUpdate
            ? `Relevé du ${formatDateFr(resultDate)} mis à jour (${formatChips(res.result.total)} jetons).`
            : `Relevé du ${formatDateFr(resultDate)} enregistré avec succès (${formatChips(res.result.total)} jetons).`
        );
        setExistingDateResult(res.result);
        if (onSaved) onSaved(res.result);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Une erreur inattendue est survenue.');
      setIsConfirmOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête de saisie */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1c3527] pb-3">
        <div>
          <h1 className="font-serif font-black text-xl text-[#f5ebd7] tracking-wider uppercase block">
            Saisie du Tapis
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {formatFullDateFr(resultDate)} • Fuseau {timezone}
          </p>
        </div>

        {/* Sélecteur de mode Détaillé vs Total direct */}
        <div className="inline-flex rounded-xl bg-[#08140e] p-1 border border-[#1b3d2c] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setEntryMode('detailed')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              entryMode === 'detailed'
                ? 'bg-[#1b3d2c] text-[#dfba73] shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Mode détaillé
          </button>
          <button
            type="button"
            onClick={() => setEntryMode('total')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              entryMode === 'total'
                ? 'bg-[#1b3d2c] text-[#dfba73] shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Total direct
          </button>
        </div>
      </div>

      {/* Date du relevé & avertissement modification existante */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-[#0b1a13] border border-[#183525]">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#dfba73] shrink-0" />
          <label htmlFor="entry-date-input" className="text-xs font-semibold text-slate-300">
            Date du relevé :
          </label>
          <input
            id="entry-date-input"
            type="date"
            value={resultDate}
            onChange={(e) => setResultDate(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-[#08140e] border border-[#1b3d2c] text-xs font-mono font-bold text-white focus:outline-none focus:border-[#c5a059]"
          />
        </div>

        {existingDateResult && (
          <span className="text-[11px] text-amber-400 font-medium flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Un relevé existe déjà pour cette date ({formatChips(existingDateResult.total)} jetons)
          </span>
        )}
      </div>

      {/* Messages de succès / erreur */}
      {successMessage && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-950/80 border border-red-800/80 text-red-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Affichage du total en direct avec variation */}
      <Card variant="brass" padding="md">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-serif font-bold uppercase tracking-widest text-[#dfba73]">
              Total calculé
            </span>
            <div className="flex items-baseline gap-2.5 mt-1">
              <span className="font-serif text-4xl sm:text-5xl font-black text-white">
                {formatChips(calculatedTotal)}
              </span>
              <span className="text-xs text-slate-400 uppercase tracking-widest">jetons</span>
            </div>

            <p className="text-xs text-slate-400 mt-1 font-mono">
              Variation :{' '}
              <span
                className={`font-bold ${
                  (variation ?? 0) > 0
                    ? 'text-emerald-400'
                    : (variation ?? 0) < 0
                    ? 'text-red-400'
                    : 'text-slate-400'
                }`}
              >
                {formatVariation(variation)}
              </span>
              {previousResult && ` (précédent : ${formatChips(previousResult.total)})`}
            </p>
          </div>

          {/* Raccourcis utiles */}
          <div className="flex items-center gap-2">
            {entryMode === 'detailed' && lastDetailedResult && (
              <button
                type="button"
                onClick={handlePrefillLastDetailed}
                title="Préremplir avec mon dernier relevé détaillé"
                className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-[#08140e] border border-[#1b3d2c] text-xs font-medium text-slate-300 hover:text-[#dfba73] hover:border-[#c5a059]/40 transition-colors"
              >
                <History className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dernier relevé</span>
              </button>
            )}

            {entryMode === 'detailed' && (
              <button
                type="button"
                onClick={handleResetChips}
                title="Remettre les jetons à zéro"
                className="p-2.5 rounded-xl bg-[#08140e] border border-[#1b3d2c] text-slate-400 hover:text-white transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Mode Détaillé : Sélecteurs tactiles des 5 couleurs */}
      {entryMode === 'detailed' ? (
        <div className="space-y-3">
          <p className="text-xs text-slate-400 font-medium">
            Ajustez les jetons avec les boutons ou tapez directement sur le jeton pour l’incrémenter :
          </p>

          {CHIP_DETAILS.map(({ color, label, value }) => {
            const count = chipCounts[color];
            const subtotal = count * value;

            return (
              <div
                key={color}
                className="flex items-center justify-between p-3 rounded-2xl bg-[#0b1a13] border border-[#183525] hover:border-[#224734] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <PokerChip
                    color={color}
                    size="md"
                    interactive
                    onClick={() => handleChipChange(color, 1)}
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-200">
                      {label} ({value} pt{value > 1 ? 's' : ''})
                    </p>
                    <p className="text-xs text-slate-400 font-mono">
                      Sous-total : {formatChips(subtotal)}
                    </p>
                  </div>
                </div>

                {/* Contrôles tactiles +/- et saisie manuelle */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleChipChange(color, -1)}
                    disabled={count <= 0}
                    aria-label={`Diminuer jeton ${label}`}
                    className="w-10 h-10 rounded-xl bg-[#08140e] border border-[#1b3d2c] text-slate-300 hover:text-white flex items-center justify-center active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-transform"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <input
                    type="number"
                    min={0}
                    value={count}
                    aria-label={`Quantité jetons ${label}`}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setChipCounts((prev) => ({
                        ...prev,
                        [color]: isNaN(val) ? 0 : Math.max(0, val)
                      }));
                    }}
                    className="w-16 h-10 rounded-xl bg-[#08140e] border border-[#1b3d2c] text-center font-serif font-bold text-base text-white focus:outline-none focus:border-[#c5a059]"
                  />

                  <button
                    type="button"
                    onClick={() => handleChipChange(color, 1)}
                    aria-label={`Augmenter jeton ${label}`}
                    className="w-10 h-10 rounded-xl bg-[#132c20] border border-[#1f4734] text-[#dfba73] hover:brightness-110 flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Mode Total Direct */
        <Card className="bg-[#0b1a13] border-[#183525] space-y-4">
          <div>
            <label htmlFor="direct-total-input" className="block text-xs font-semibold text-slate-300 mb-1">
              Valeur totale brute de vos jetons
            </label>
            <input
              id="direct-total-input"
              type="number"
              min={0}
              value={directTotal || ''}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setDirectTotal(isNaN(val) ? 0 : Math.max(0, val));
              }}
              placeholder="Ex: 585"
              className="w-full px-4 py-3 rounded-xl bg-[#08140e] border border-[#1b3d2c] font-serif font-bold text-xl text-white placeholder-slate-600 focus:outline-none focus:border-[#c5a059]"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-[#08140e] border border-amber-900/40 text-amber-300 text-xs space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" /> Mode total direct activé
            </p>
            <p className="text-slate-400 leading-relaxed">
              Dans ce mode, aucune répartition par couleur n'est enregistrée ni extrapolée. L'historique et les statistiques indiqueront explicitement que le détail des couleurs n'est pas disponible pour ce relevé.
            </p>
          </div>
        </Card>
      )}

      {/* Bouton de validation d'enregistrement */}
      <Button
        type="button"
        variant="primary"
        size="lg"
        fullWidth
        onClick={handleOpenConfirm}
        className="mt-6"
      >
        Valider le relevé ({formatChips(calculatedTotal)} jetons)
      </Button>

      {/* =========================================================================
          MODALE DE CONFIRMATION AVANT ENREGISTREMENT
         ========================================================================= */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <Card variant="brass" className="w-full max-w-md p-6 bg-[#0b1a13] relative space-y-4">
            <button
              onClick={() => setIsConfirmOpen(false)}
              aria-label="Annuler"
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white bg-[#08140e] border border-[#1b3d2c]"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="font-serif font-black text-lg text-[#f5ebd7] tracking-wider uppercase block">
                Confirmer le relevé
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                Vérifiez les informations avant enregistrement définitif
              </p>
            </div>

            {/* Avertissement écrasement si déjà présent */}
            {existingDateResult && (
              <div className="p-3 rounded-xl bg-amber-950/80 border border-amber-800/80 text-amber-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Un relevé existe déjà pour le <strong>{formatDateFr(resultDate)}</strong> ({formatChips(existingDateResult.total)} jetons). Cet enregistrement va le <strong>remplacer</strong>.
                </span>
              </div>
            )}

            {/* Récapitulatif de la saisie */}
            <div className="p-3.5 rounded-xl bg-[#08140e] border border-[#1b3d2c] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Date du relevé :</span>
                <span className="font-bold text-white font-mono">{formatDateFr(resultDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Mode de saisie :</span>
                <span className="font-bold text-[#dfba73]">
                  {entryMode === 'detailed' ? 'Détaillé par couleur' : 'Total direct'}
                </span>
              </div>

              {entryMode === 'detailed' && (
                <div className="pt-2 border-t border-[#183525] space-y-1">
                  <span className="text-slate-400 block mb-1">Détail des jetons :</span>
                  {CHIP_DETAILS.map(({ color, label }) => (
                    <div key={color} className="flex justify-between text-slate-300">
                      <span>{label} :</span>
                      <span className="font-mono font-bold">{chipCounts[color]}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-[#183525] flex justify-between items-baseline">
                <span className="text-sm font-bold text-white font-serif">Total validé :</span>
                <span className="text-lg font-black font-serif text-[#dfba73]">
                  {formatChips(calculatedTotal)} jetons
                </span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                variant="secondary"
                size="md"
                fullWidth
                disabled={isSaving}
                onClick={() => setIsConfirmOpen(false)}
              >
                Modifier
              </Button>
              <Button
                variant="primary"
                size="md"
                fullWidth
                disabled={isSaving}
                onClick={handleExecuteSave}
              >
                {isSaving ? 'Enregistrement...' : 'Confirmer et enregistrer'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
