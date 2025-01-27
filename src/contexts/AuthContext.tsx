import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (usernameOrEmail: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (usernameOrEmail: string, password: string) => {
    // Check if input is an email
    const isEmail = usernameOrEmail.includes('@');

    try {
      if (isEmail) {
        // If it's an email, sign in directly
        const { error } = await supabase.auth.signInWithPassword({ 
          email: usernameOrEmail, 
          password 
        });
        if (error) throw error;
      } else {
        // If it's a username, first get the email from profiles table
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', usernameOrEmail);

        // Handle case where username doesn't exist
        if (profileError || !profiles || profiles.length === 0) {
          throw new Error('Invalid username or password');
        }

        // Then sign in with the email
        const { error } = await supabase.auth.signInWithPassword({ 
          email: profiles[0].email, 
          password 
        });
        if (error) throw error;
      }
    } catch (error: any) {
      if (error.message === 'Invalid login credentials') {
        throw new Error('Invalid username or password');
      }
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}