import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, AUTH_CALLBACK_URL } from '@/lib/supabaseClient';
import type { Profile } from '@/types/db';

interface AuthResult {
  error: string | null;
  needConfirm?: boolean;
}

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, fullName: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signInAsAdmin: (username: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function translateAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials')) return 'Email hoặc mật khẩu không đúng.';
  if (lower.includes('email not confirmed')) return 'Email chưa được xác nhận. Vui lòng kiểm tra hộp thư.';
  if (lower.includes('user already registered')) return 'Email này đã được đăng ký.';
  if (lower.includes('password should be at least')) return 'Mật khẩu phải có ít nhất 6 ký tự.';
  if (lower.includes('unable to validate email')) return 'Email không hợp lệ.';
  if (lower.includes('rate limit')) return 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.';
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session ?? null);
      })
      .catch(() => {
        if (active) setSession(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
      setLoading(false);
      if (!nextSession) setProfile(null);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user?.id ?? null;

  const refreshProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      return;
    }
    setProfileLoading(true);
    try {
      const meta = session?.user?.user_metadata ?? {};
      const { data, error } = await supabase.rpc('ensure_profile', {
        p_full_name: (meta.full_name as string) ?? '',
        p_phone: (meta.phone as string) ?? '',
      });
      if (!error && data) {
        setProfile(data as unknown as Profile);
      }
    } catch {
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, [userId, session]);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }
    refreshProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (profile?.role !== 'admin') return;
    const flag = 'yamato_test_accounts_seeded_v1';
    if (localStorage.getItem(flag)) return;
    supabase.functions
      .invoke('seed-test-accounts', { body: {} })
      .then(({ error }) => {
        if (!error) localStorage.setItem(flag, '1');
      })
      .catch(() => undefined);
  }, [profile?.role]);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: translateAuthError(error.message) };
      return { error: null };
    } catch {
      return { error: 'Không thể kết nối máy chủ. Vui lòng thử lại.' };
    }
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, fullName: string): Promise<AuthResult> => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: AUTH_CALLBACK_URL,
          },
        });
        if (error) return { error: translateAuthError(error.message) };
        if (!data.session) return { error: null, needConfirm: true };
        return { error: null, needConfirm: false };
      } catch {
        return { error: 'Không thể kết nối máy chủ. Vui lòng thử lại.' };
      }
    },
    [],
  );

  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: AUTH_CALLBACK_URL,
          queryParams: { prompt: 'select_account' },
        },
      });
      if (error) {
        return {
          error: 'Chưa bật đăng nhập Google. Vui lòng liên hệ quản trị viên để bật Google Provider.',
        };
      }
      return { error: null };
    } catch {
      return { error: 'Không thể kết nối Google. Vui lòng thử lại.' };
    }
  }, []);

  const signInAsAdmin = useCallback(async (username: string, password: string): Promise<AuthResult> => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-login', {
        body: { username, password },
      });

      if (error) {
        let message = '';
        try {
          const ctx = (error as { context?: { json?: () => Promise<{ error?: string }> } }).context;
          if (ctx?.json) {
            const body = await ctx.json();
            message = body?.error ?? '';
          }
        } catch {
          message = '';
        }
        if (message && message !== 'INVALID_CREDENTIALS' && message !== 'CHUA_CAU_HINH') {
          return { error: `Không thể đăng nhập quản trị: ${message}` };
        }
        return { error: 'Tài khoản hoặc mật khẩu quản trị không đúng.' };
      }

      const payload = data as { email?: string; error?: string } | null;
      if (!payload?.email) {
        return { error: 'Không thể xác thực tài khoản quản trị.' };
      }

      const { error: signError } = await supabase.auth.signInWithPassword({
        email: payload.email,
        password,
      });
      if (signError) return { error: translateAuthError(signError.message) };
      return { error: null };
    } catch {
      return { error: 'Không thể kết nối máy chủ. Vui lòng thử lại.' };
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      loading,
      profileLoading,
      signIn,
      signUp,
      signInWithGoogle,
      signInAsAdmin,
      signOut,
      refreshProfile,
    }),
    [
      session,
      profile,
      loading,
      profileLoading,
      signIn,
      signUp,
      signInWithGoogle,
      signInAsAdmin,
      signOut,
      refreshProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}