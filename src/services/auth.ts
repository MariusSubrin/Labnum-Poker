import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile } from '../types';
import { User, Session } from '@supabase/supabase-js';

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error?: string;
}

/**
 * Inscription par e-mail et mot de passe
 */
export async function signUpWithEmail(email: string, password: string, displayName: string): Promise<AuthResponse> {
  if (!isSupabaseConfigured()) {
    return { user: null, session: null, error: 'Supabase n’est pas configuré. Veuillez renseigner le fichier .env.' };
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        display_name: displayName.trim()
      }
    }
  });

  if (error) {
    return { user: null, session: null, error: error.message };
  }

  // Création du profil initial dans public.profiles si session disponible
  if (data.user) {
    await upsertProfile(data.user.id, displayName);
  }

  return { user: data.user, session: data.session };
}

/**
 * Connexion par e-mail et mot de passe
 */
export async function signInWithPassword(email: string, password: string): Promise<AuthResponse> {
  if (!isSupabaseConfigured()) {
    return { user: null, session: null, error: 'Supabase n’est pas configuré. Veuillez renseigner le fichier .env.' };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password
  });

  if (error) {
    return { user: null, session: null, error: error.message };
  }

  return { user: data.user, session: data.session };
}

/**
 * Connexion par Magic Link (lien de connexion envoyé par e-mail)
 */
export async function signInWithMagicLink(email: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase n’est pas configuré. Veuillez renseigner le fichier .env.' };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: {
      emailRedirectTo: window.location.origin
    }
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Déconnexion de l'utilisateur
 */
export async function signOut(): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) {
    return {};
  }
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { error: error.message };
  }
  return {};
}

/**
 * Récupère le profil public d'un utilisateur
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    userId: data.user_id,
    displayName: data.display_name,
    avatarKey: data.avatar_key,
    createdAt: data.created_at
  };
}

/**
 * Crée ou met à jour le profil public
 */
export async function upsertProfile(userId: string, displayName: string, avatarKey?: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  const { error } = await supabase.from('profiles').upsert({
    user_id: userId,
    display_name: displayName.trim(),
    avatar_key: avatarKey || null
  });

  return !error;
}
