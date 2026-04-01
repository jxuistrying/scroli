import * as React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { useAuthStore } from '../stores/authStore';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { setHasCompletedOnboarding, reset } = useAuthStore();

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('has_completed_onboarding')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setHasCompletedOnboarding(data.has_completed_onboarding);
      }
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
    }
  };

  useEffect(() => {
    console.log('AuthProvider mounted');

    // Restore existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('getSession resolved:', session?.user?.id);
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => {
          console.log('fetchProfile (initial) finished, setting loading to false');
          setLoading(false);
        });
      } else {
        console.log('No initial session, setting loading to false');
        setLoading(false);
      }
    }).catch(err => {
      console.error('getSession error:', err);
      setLoading(false);
    });

    // Listen for auth state changes
    console.log('Setting up onAuthStateChange listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('onAuthStateChange fired:', _event, session?.user?.id);
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => {
          setLoading(false);
        });
      } else {
        reset();
        setLoading(false);
      }
    });

    return () => {
      console.log('AuthProvider unmounting');
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
