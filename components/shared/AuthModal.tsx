'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Smartphone, ShieldCheck, Mail, IdCard, User as UserIcon } from 'lucide-react';
import ValidatedInput from '../ui/input/ValidatedInput';
import FloatingInput from '../ui/input/FloatingInput';

type RegisterForm = {
  name: string;
  email: string;
  phone: string;
  nic: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;

  // Wire these to your GraphQL later:
  onLogin?: (phone: string) => Promise<void> | void;                // send OTP
  onVerifyOtp?: (phone: string, otp: number) => Promise<void> | void;
  onRegister?: (data: RegisterForm) => Promise<void> | void;

  initialPhone?: string;
};

type View = 'login-phone' | 'login-otp' | 'register';

const phoneIsValid = (v: string) => /^0\d{9}$/.test(v.trim());
const emailIsValid = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const onlyDigits = (v: string) => v.replace(/\D/g, '');

export default function AuthModal({
  isOpen,
  onClose,
  onLogin,
  onVerifyOtp,
  onRegister,
  initialPhone = '',
}: Props) {
  const [view, setView] = useState<View>('login-phone');

  // ——— Login: phone → OTP ———
  const [loginPhone, setLoginPhone] = useState(initialPhone);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otp, setOtp] = useState<string[]>(['', '', '', '']);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([null, null, null, null]);

  // ——— Register form ———
  const [reg, setReg] = useState<RegisterForm>({
    name: '',
    email: '',
    phone: '',
    nic: '',
  });
  const [valid, setValid] = useState({
    name: null as boolean | null,
    email: null as boolean | null,
    phone: null as boolean | null,
    nic: null as boolean | null, // not strictly required but included
  });
  const registerBusy = false; // hook your onRegister async state if needed

  const modalRef = useRef<HTMLDivElement | null>(null);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);

  // Handle open/close resets
  useEffect(() => {
    if (!isOpen) return;
    setView('login-phone');
    setOtp(['', '', '', '']);
    setLoginPhone(initialPhone);
    setReg({ name: '', email: '', phone: '', nic: '' });
    setValid({ name: null, email: null, phone: null, nic: null });

    const t = setTimeout(() => {
      phoneInputRef.current?.focus();
    }, 50);
    return () => clearTimeout(t);
  }, [isOpen, initialPhone]);

  // Esc to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const otpValue = useMemo(() => otp.join(''), [otp]);

  const handleSendOtp = async () => {
    if (!phoneIsValid(loginPhone)) return;
    try {
      setSending(true);
      await onLogin?.(loginPhone);
      setView('login-otp');
      setTimeout(() => otpRefs.current[0]?.focus(), 30);
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpValue.length !== 4) return;
    const code = parseInt(otpValue, 10);
    if (Number.isNaN(code)) return;     
    try {
        setVerifying(true);
        await onVerifyOtp?.(loginPhone, code);   
    } finally {
        setVerifying(false);
    }
};

  // OTP input handlers
  const handleOtpChange = (index: number, val: string) => {
    const d = onlyDigits(val).slice(-1); // last digit only
    setOtp(prev => {
      const copy = [...prev];
      copy[index] = d;
      return copy;
    });
    if (d && index < 3) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowUp') && index > 0) {
      e.preventDefault();
      otpRefs.current[index - 1]?.focus();
    }
    if ((e.key === 'ArrowRight' || e.key === 'ArrowDown') && index < 3) {
      e.preventDefault();
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = onlyDigits(e.clipboardData.getData('text')).slice(0, 4);
    if (!text) return;
    e.preventDefault();
    const arr = text.split('');
    setOtp([arr[0] || '', arr[1] || '', arr[2] || '', arr[3] || '']);
    const nextIndex = Math.min(text.length, 4) - 1;
    otpRefs.current[nextIndex]?.focus();
  };

  // Register validations
  const updateReg = (field: keyof RegisterForm, value: string) => {
    setReg(prev => ({ ...prev, [field]: value }));
  };

  const onDebouncedEmail = (value: string) => {
    setValid(v => ({ ...v, email: value ? emailIsValid(value) : null }));
  };

  const onDebouncedPhone = (value: string) => {
    setValid(v => ({ ...v, phone: value ? phoneIsValid(value) : null }));
  };

  const onDebouncedName = (value: string) => {
    const ok = value.trim().length >= 2;
    setValid(v => ({ ...v, name: value ? ok : null }));
  };

  // NIC: you didn’t require strict validation; we’ll just mark non-empty as ok
  const onDebouncedNic = (value: string) => {
    const ok = value.trim().length > 0;
    setValid(v => ({ ...v, nic: value ? ok : null }));
  };

  const canRegister =
    valid.name === true && valid.email === true && valid.phone === true && valid.nic === true;

  const submitRegister = async () => {
    if (!canRegister) return;
    await onRegister?.(reg);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="auth-title"
      aria-describedby="auth-desc"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        ref={modalRef}
        className="relative w-full max-w-md rounded-3xl border border-white/20 bg-white/80 p-5 shadow-2xl backdrop-blur-xl ring-1 ring-black/5 dark:bg-slate-900/80 dark:border-white/10"
      >
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 id="auth-title" className="text-xl font-semibold">
              {view === 'register' ? 'Create Account' : 'Welcome back'}
            </h2>
            <p id="auth-desc" className="text-sm text-slate-600 dark:text-slate-300">
              {view === 'register'
                ? 'Enter your details to get started'
                : view === 'login-otp'
                ? 'We sent a 4-digit code to your phone'
                : 'Sign in with your phone number'}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {view === 'login-phone' && (
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                <Smartphone className="h-5 w-5" />
              </div>
              <FloatingInput
                id="login-phone"
                ref={phoneInputRef as any}
                label="Phone number (07XXXXXXXX)"
                inputMode="numeric"
                maxLength={10}
                value={loginPhone}
                onChange={(e) => setLoginPhone(onlyDigits(e.target.value))}
                className={`${loginPhone && !phoneIsValid(loginPhone) ? 'border-red-500' : 'border-gray-200 dark:border-neutral-700'}`}
              />
            </div>

            <button
              onClick={handleSendOtp}
              disabled={!phoneIsValid(loginPhone) || sending}
              className="w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900"
            >
              {sending ? 'Sending…' : 'Send OTP'}
            </button>

            <div className="text-center text-sm">
              New here?{' '}
              <button
                onClick={() => setView('register')}
                className="font-semibold text-violet-700 hover:underline dark:text-violet-300"
              >
                Register
              </button>
            </div>
          </div>
        )}

        {view === 'login-otp' && (
          <div className="space-y-4">
            {/* Phone recap */}
            <div className="rounded-xl bg-black/5 px-4 py-2 text-sm dark:bg-white/10">
              Signing in as: <span className="font-medium">{loginPhone}</span>{' '}
              <button
                className="ml-2 text-violet-700 hover:underline dark:text-violet-300"
                onClick={() => setView('login-phone')}
              >
                change
              </button>
            </div>

            {/* OTP inputs */}
            <div className="flex items-center justify-center gap-3">
              {otp.map((v, i) => (
                <input
                  key={i}
                  ref={(el) => (otpRefs.current[i] = el)}
                  value={v}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  onPaste={handleOtpPaste}
                  inputMode="numeric"
                  maxLength={1}
                  className="h-12 w-12 rounded-2xl border border-gray-200 bg-gray-100 text-center text-lg font-semibold tracking-widest focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-100"
                />
              ))}
            </div>
            {otpValue.length !== 4 && otp.some(Boolean) && (
              <p className="text-center text-xs text-red-600">Enter the 4-digit code.</p>
            )}

            <button
              onClick={handleVerifyOtp}
              disabled={otpValue.length !== 4 || verifying}
              className="w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900"
            >
              {verifying ? 'Verifying…' : 'Verify & Continue'}
            </button>

            <div className="text-center text-sm">
              Don’t have an account?{' '}
              <button
                onClick={() => setView('register')}
                className="font-semibold text-violet-700 hover:underline dark:text-violet-300"
              >
                Register
              </button>
            </div>
          </div>
        )}

        {view === 'register' && (
          <div className="space-y-4">
            <ValidatedInput
              label={
                <span className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" /> Full Name
                </span>
              }
              placeholder=" "
              onDebouncedChange={(v) => {
                onDebouncedName(v);
                updateReg('name', v);
              }}
              isValid={valid.name}
              maxLength={100}
            />

            <ValidatedInput
              type="email"
              label={
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Email
                </span>
              }
              placeholder=" "
              onDebouncedChange={(v) => {
                onDebouncedEmail(v);
                updateReg('email', v);
              }}
              isValid={valid.email}
              inputMode="email"
              maxLength={100}
            />

            <ValidatedInput
              label={
                <span className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" /> Phone (07XXXXXXXX)
                </span>
              }
              placeholder=" "
              onDebouncedChange={(v) => {
                const digits = onlyDigits(v);
                onDebouncedPhone(digits);
                updateReg('phone', digits);
              }}
              isValid={valid.phone}
              inputMode="numeric"
              maxLength={10}
            />

            <ValidatedInput
              label={
                <span className="flex items-center gap-2">
                  <IdCard className="h-4 w-4" /> NIC Number
                </span>
              }
              placeholder=" "
              onDebouncedChange={(v) => {
                onDebouncedNic(v);
                updateReg('nic', v);
              }}
              isValid={valid.nic}
              maxLength={20}
            />

            <button
              onClick={submitRegister}
              disabled={!canRegister || registerBusy}
              className="mt-2 w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900"
            >
              {registerBusy ? 'Creating…' : 'Create Account'}
            </button>

            <div className="text-center text-sm">
              Already have an account?{' '}
              <button
                onClick={() => setView('login-phone')}
                className="font-semibold text-violet-700 hover:underline dark:text-violet-300"
              >
                Sign in
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
