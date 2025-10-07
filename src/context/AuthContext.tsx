import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const hasValidSupabaseConfig = !!(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('https://') && supabaseUrl.includes('.supabase.co') && supabaseAnonKey.length > 20);
export const supabase = hasValidSupabaseConfig ? createClient(supabaseUrl!, supabaseAnonKey!) : null;

type User = { id: string; email: string | null };

type Ctx = {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  login: (email: string, password: string) => Promise<{ error: any }>;
  register: (email: string, password: string) => Promise<{ error: any }>;
  updatePasswordWithToken: (token: string, password: string) => Promise<{ error: any }>;
};

const AuthContext = createContext<Ctx | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email } : null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email } : null);
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const ensureConfigured = () =>
    (!supabase || !hasValidSupabaseConfig)
      ? { error: { message: 'Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' } }
      : null;

const signUp = async (email: string, password: string) => {
  const bad = ensureConfigured(); if (bad) return bad;
  const { data, error } = await supabase!.auth.signUp({ email, password });
  if (!error && data.user) {
    setUser({ id: data.user.id, email: data.user.email });
  }
  return { error };
};

const signIn = async (email: string, password: string) => {
  const bad = ensureConfigured(); if (bad) return bad;
  const { data, error } = await supabase!.auth.signInWithPassword({ email, password });
  if (!error && data.user) {
    setUser({ id: data.user.id, email: data.user.email });
  }
  return { error };
};

  const signOut = async () => {
    if (!supabase || !hasValidSupabaseConfig) return;
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const bad = ensureConfigured(); if (bad) return bad;
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase!.auth.resetPasswordForEmail(email, { redirectTo });
    return { error };
  };

  const login = signIn;
  const register = signUp;
  const updatePasswordWithToken = async (_token: string, password: string) => {
    const bad = ensureConfigured(); if (bad) return bad;

    const { data: { session } } = await supabase!.auth.getSession();
    if (!session) return { error: { message: 'Recovery session missing. Open the reset link from your email on this device, then retry.' } };

    const { error } = await supabase!.auth.updateUser({ password });
    return { error };
  };

  const value: Ctx = {
    user, loading,
    signUp, signIn, signOut, resetPassword,
    login, register, updatePasswordWithToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
