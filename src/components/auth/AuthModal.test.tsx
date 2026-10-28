import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthModal } from './AuthModal';
import { AuthProvider } from '../../context/AuthContext';

describe('AuthModal - Authentification', () => {
  it('ne s’affiche pas quand isOpen est false', () => {
    render(
      <AuthProvider>
        <AuthModal isOpen={false} onClose={() => {}} />
      </AuthProvider>
    );
    expect(screen.queryByText(/connexion/i)).not.toBeInTheDocument();
  });

  it('affiche le formulaire de connexion par défaut', () => {
    render(
      <AuthProvider>
        <AuthModal isOpen={true} onClose={() => {}} />
      </AuthProvider>
    );
    expect(screen.getByText('Connexion')).toBeInTheDocument();
    expect(screen.getByLabelText(/adresse e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
  });

  it('bascule vers le mode inscription au clic sur le lien', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <AuthModal isOpen={true} onClose={() => {}} />
      </AuthProvider>
    );

    const signupLink = screen.getByRole('button', { name: /pas encore de compte \? s'inscrire/i });
    await user.click(signupLink);

    expect(screen.getByText('Rejoindre le Club')).toBeInTheDocument();
    expect(screen.getByLabelText(/pseudo à la table/i)).toBeInTheDocument();
  });

  it('ferme la modale au clic sur le bouton de fermeture', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    render(
      <AuthProvider>
        <AuthModal isOpen={true} onClose={handleClose} />
      </AuthProvider>
    );

    const closeBtn = screen.getByRole('button', { name: /fermer/i });
    await user.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });
});
