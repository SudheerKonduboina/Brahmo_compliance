'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabaseBrowser } from '@/lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  role: 'partner' | 'associate' | 'admin';
  name?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  authInitialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  switchUser: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabaseBrowser
        .from('users')
        .select('id, email, role, name')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data as UserProfile);
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  useEffect(() => {
    // Initial session hydration - strict order
    const hydrateSession = async () => {
      try {
        // 1. Call getSession()
        const { data: { session } } = await supabaseBrowser.auth.getSession();
        
        // 2. Set session and user
        setSession(session);
        setUser(session?.user || null);
        
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        }
      } catch (err) {
        console.error('Session hydration error:', err);
        setUser(null);
        setSession(null);
      } finally {
        setAuthInitialized(true);
      }
    };

    hydrateSession();

    // 4. Attach onAuthStateChange and update state on event changes
    const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user || null);
      setProfile(null);

      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    await supabaseBrowser.auth.signInWithPassword({ email, password });
  };

  const signOut = async () => {
    await supabaseBrowser.auth.signOut();
  };

  const switchUser = async (email: string, password: string) => {
    await signOut();
    await signIn(email, password);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        authInitialized,
        signIn,
        signOut,
        switchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
