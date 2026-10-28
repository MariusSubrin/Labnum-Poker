import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Group, GroupMember, UserProfile } from '../types';
import { getUserProfile, signOut as authSignOut } from '../services/auth';
import { getUserMembership } from '../services/groups';

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  currentGroup: Group | null;
  membership: GroupMember | null;
  isLoading: boolean;
  isConfigured: boolean;
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
  // Mode démo / aperçu si Supabase n'est pas encore branché
  isDemoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [membership, setMembership] = useState<GroupMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(!isSupabaseConfigured());

  const isConfigured = useMemo(() => isSupabaseConfigured(), []);

  const refreshSession = async () => {
    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const [userProfile, userGroup] = await Promise.all([
          getUserProfile(session.user.id),
          getUserMembership(session.user.id)
        ]);
        setProfile(userProfile);
        setCurrentGroup(userGroup.group);
        setMembership(userGroup.membership);
      } else {
        setUser(null);
        setProfile(null);
        setCurrentGroup(null);
        setMembership(null);
      }
    } catch {
      // Ignorer les erreurs réseau temporaires
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();

    if (isSupabaseConfigured()) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser(session.user);
          refreshSession();
        } else {
          setUser(null);
          setProfile(null);
          setCurrentGroup(null);
          setMembership(null);
          setIsLoading(false);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleSignOut = async () => {
    await authSignOut();
    setUser(null);
    setProfile(null);
    setCurrentGroup(null);
    setMembership(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        currentGroup,
        membership,
        isLoading,
        isConfigured,
        refreshSession,
        signOut: handleSignOut,
        isDemoMode,
        setDemoMode: setIsDemoMode
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé au sein d’un AuthProvider');
  }
  return context;
}
