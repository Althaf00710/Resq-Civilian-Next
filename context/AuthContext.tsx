'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useMutation } from '@apollo/client';
import AuthModal from '@/components/shared/AuthModal';
import { SEND_CIVILIAN_OTP, LOGIN_CIVILIAN } from '@/graphql/mutations/civilianMutations';
import { clearSession, extractJwtFromMessage, loadSession, saveSession, Civilian } from '@/lib/auth';

type Ctx = {
  isLoggedIn: boolean;
  token: string | null;
  civilian: Civilian | null;
  openAuth: () => void;
  closeAuth: () => void;
  logout: () => void;
};

const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [{ token, civilian }, setSession] = useState<{ token: string | null; civilian: Civilian | null }>({
    token: null,
    civilian: null,
  });
  const [isOpen, setOpen] = useState(false);

  const [sendOtp] = useMutation(SEND_CIVILIAN_OTP);
  const [loginCivilian] = useMutation(LOGIN_CIVILIAN);

  useEffect(() => {
    const { token, civilian } = loadSession();
    setSession({ token, civilian });
  }, []);

  const isLoggedIn = !!token && !!civilian;

  const openAuth = () => setOpen(true);
  const closeAuth = () => setOpen(false);

  const logout = () => {
    clearSession();
    setSession({ token: null, civilian: null });
  };

  const onLogin = async (phone: string) => {
    await sendOtp({ variables: { phoneNumber: phone } });
  };

  const onVerifyOtp = async (phone: string, otp: number) => {
    const { data } = await loginCivilian({ variables: { phoneNumber: phone, otp } });
    const res = data?.loginCivilian;
    if (!res?.success || !res?.civilian) {
      throw new Error(res?.message || 'Login failed');
    }
    const jwt = extractJwtFromMessage(res.message);
    if (jwt) {
      saveSession(jwt, res.civilian);
      setSession({ token: jwt, civilian: res.civilian });
    }
    setOpen(false);
  };

  const value = useMemo(
    () => ({ isLoggedIn, token, civilian, openAuth, closeAuth, logout }),
    [isLoggedIn, token, civilian]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthModal isOpen={isOpen} onClose={closeAuth} onLogin={onLogin} onVerifyOtp={onVerifyOtp} />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
