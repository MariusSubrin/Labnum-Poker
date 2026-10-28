import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BottomNav } from './BottomNav';

describe('BottomNav - Navigation principale', () => {
  it('affiche les quatre onglets requis (Accueil, Compter, Joueurs, Mains)', () => {
    const handleTabChange = vi.fn();
    render(<BottomNav activeTab="dashboard" onTabChange={handleTabChange} />);

    expect(screen.getByRole('button', { name: /accueil/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /compter/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /joueurs/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mains/i })).toBeInTheDocument();
  });

  it('indique correctement l’onglet actif avec aria-current="page"', () => {
    const handleTabChange = vi.fn();
    render(<BottomNav activeTab="count" onTabChange={handleTabChange} />);

    const countButton = screen.getByRole('button', { name: /compter/i });
    expect(countButton).toHaveAttribute('aria-current', 'page');

    const homeButton = screen.getByRole('button', { name: /accueil/i });
    expect(homeButton).not.toHaveAttribute('aria-current');
  });

  it('appelle onTabChange avec l’identifiant de l’onglet lors d’un clic', async () => {
    const user = userEvent.setup();
    const handleTabChange = vi.fn();
    render(<BottomNav activeTab="dashboard" onTabChange={handleTabChange} />);

    await user.click(screen.getByRole('button', { name: /mains/i }));
    expect(handleTabChange).toHaveBeenCalledWith('hands');
  });
});
