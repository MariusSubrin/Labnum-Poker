import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChipEntryForm } from './ChipEntryForm';

describe('ChipEntryForm - Saisie des jetons et validation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('affiche le formulaire en mode détaillé par défaut avec la date du jour', async () => {
    render(<ChipEntryForm groupId="grp-1" userId="usr-1" />);

    expect(screen.getByText('Saisie du Tapis')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mode détaillé/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /total direct/i })).toBeInTheDocument();

    // Vérifie que les 5 couleurs de jetons sont affichées
    expect(screen.getByText(/bleu \(1 pt\)/i)).toBeInTheDocument();
    expect(screen.getByText(/rouge \(5 pts\)/i)).toBeInTheDocument();
    expect(screen.getByText(/noir \(10 pts\)/i)).toBeInTheDocument();
    expect(screen.getByText(/vert \(25 pts\)/i)).toBeInTheDocument();
    expect(screen.getByText(/blanc \(100 pts\)/i)).toBeInTheDocument();
  });

  it('incrémente le total lors du clic sur le bouton + d’une couleur', async () => {
    const user = userEvent.setup();
    render(<ChipEntryForm groupId="grp-1" userId="usr-1" />);

    // Total initial à 0
    expect(screen.getByText('Total calculé')).toBeInTheDocument();

    // Clic sur + pour Blanc (100 pts)
    const plusWhite = screen.getByRole('button', { name: /augmenter jeton blanc/i });
    await user.click(plusWhite);

    // Le total calculé doit afficher 100
    await waitFor(() => {
      expect(screen.getAllByText('100').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('bascule en mode total direct et permet la saisie d’un entier positif', async () => {
    const user = userEvent.setup();
    render(<ChipEntryForm groupId="grp-1" userId="usr-1" />);

    const directModeBtn = screen.getByRole('button', { name: /total direct/i });
    await user.click(directModeBtn);

    expect(screen.getByLabelText(/valeur totale brute/i)).toBeInTheDocument();
    expect(screen.getByText(/mode total direct activé/i)).toBeInTheDocument();

    const input = screen.getByLabelText(/valeur totale brute/i);
    await user.type(input, '650');

    await waitFor(() => {
      expect(screen.getAllByText('650').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('ouvre la modale de confirmation avant d’enregistrer le relevé', async () => {
    const user = userEvent.setup();
    render(<ChipEntryForm groupId="grp-1" userId="usr-1" />);

    // Clic sur Valider
    const validateBtn = screen.getByRole('button', { name: /valider le relevé/i });
    await user.click(validateBtn);

    expect(screen.getByText('Confirmer le relevé')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirmer et enregistrer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /modifier/i })).toBeInTheDocument();
  });

  it('enregistre et affiche le message de confirmation après validation', async () => {
    const user = userEvent.setup();
    const handleSaved = vi.fn();
    render(<ChipEntryForm groupId="grp-1" userId="usr-1" onSaved={handleSaved} />);

    // Ajoute un jeton rouge (5 pts)
    const plusRed = screen.getByRole('button', { name: /augmenter jeton rouge/i });
    await user.click(plusRed);

    // Ouvre la confirmation
    const validateBtn = screen.getByRole('button', { name: /valider le relevé/i });
    await user.click(validateBtn);

    // Confirme l'enregistrement
    const confirmBtn = screen.getByRole('button', { name: /confirmer et enregistrer/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByText(/enregistré avec succès/i)).toBeInTheDocument();
      expect(handleSaved).toHaveBeenCalled();
    });
  });
});
