import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';

describe('App - Shell responsive et navigation', () => {
  it('affiche le tableau de bord par défaut avec le titre et les cartes', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /état de la table/i })).toBeInTheDocument();
    expect(screen.getByText(/mon tapis actuel/i)).toBeInTheDocument();
    expect(screen.getByText(/classement de la table/i)).toBeInTheDocument();
  });

  it('navigue vers l’onglet Compter lors du clic sur le bouton de navigation', async () => {
    const user = userEvent.setup();
    render(<App />);

    const countTab = screen.getByRole('button', { name: /compter/i });
    await user.click(countTab);

    expect(screen.getByRole('heading', { name: /saisie du tapis/i })).toBeInTheDocument();
    expect(screen.getByText(/total calculé/i)).toBeInTheDocument();
  });

  it('navigue vers l’onglet Mains et affiche les 10 combinaisons officielles', async () => {
    const user = userEvent.setup();
    render(<App />);

    const handsTab = screen.getByRole('button', { name: /mains/i });
    await user.click(handsTab);

    expect(screen.getByRole('heading', { name: /combinaisons de poker/i })).toBeInTheDocument();
    expect(screen.getByText('Quinte Flush Royale')).toBeInTheDocument();
    expect(screen.getByText('Carte Haute')).toBeInTheDocument();
  });

  it('navigue vers l’onglet Joueurs et affiche la liste des membres', async () => {
    const user = userEvent.setup();
    render(<App />);

    const playersTab = screen.getByRole('button', { name: /joueurs/i });
    await user.click(playersTab);

    expect(screen.getByRole('heading', { name: /membres de la table/i })).toBeInTheDocument();
    expect(screen.getAllByText('Thomas').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Nicolas')).toBeInTheDocument();
  });
});
