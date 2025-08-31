// components/shared/GlassBottomNav.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { Home, Heart, Search, User, Bell, ClipboardList, LogOut } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import BottomSheet from '../ui/Notification/BottomSheet';
import NotificationLabel from '../ui/Notification/NotificationLabel';
import CivilianStatusModal from '@/components-page/profile/CivilianStatusModal';

type NavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
  color: 'violet' | 'pink' | 'amber' | 'cyan';
};

type AnyNotif =
  | string
  | { id?: string | number; title?: string; message?: string; text?: string; createdAt?: string; read?: boolean };

const NAV: NavItem[] = [
  { href: '/', label: 'Home', Icon: Home, color: 'violet' },
  { href: '/first-aids', label: 'First Aids', Icon: Heart, color: 'pink' },
  { href: '/snakes', label: 'Snakes', Icon: Search, color: 'amber' },
  { href: '/request', label: 'Request', Icon: Search, color: 'amber' },
  { href: '/notification', label: 'Notifications', Icon: Bell, color: 'amber' }, // <— opens sheet
  { href: '/profile', label: 'Profile', Icon: User, color: 'cyan' }, // <— opens anchored menu
];

const colorMap = {
  violet: { active: 'bg-violet-500 text-white', hover: 'group-hover:bg-violet-100/80', tooltip: 'bg-violet-500 text-white' },
  pink: { active: 'bg-pink-500 text-white', hover: 'group-hover:bg-pink-100/80', tooltip: 'bg-pink-500 text-white' },
  amber: {
    active: 'bg-amber-400 text-slate-900',
    hover: 'group-hover:bg-amber-100/80',
    tooltip: 'bg-amber-400 text-slate-900',
  },
  cyan: { active: 'bg-cyan-500 text-white', hover: 'group-hover:bg-cyan-100/80', tooltip: 'bg-cyan-500 text-white' },
};

type NormalizedNotification = {
  id: string;
  title?: string;
  message: string;
  createdAt?: string;
  read?: boolean;
};

function normalizeNotifications(raw: unknown): NormalizedNotification[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((n: AnyNotif, idx) => {
    if (typeof n === 'string') {
      return { id: String(idx), message: n };
    }
    const msg = n.message ?? n.text ?? '';
    const ttl = n.title ?? undefined;
    const created = typeof n.createdAt === 'string' ? n.createdAt : undefined;
    const read = typeof n.read === 'boolean' ? n.read : undefined;
    const id = n.id != null ? String(n.id) : String(idx);
    return { id, title: ttl, message: msg || '(no message)', createdAt: created, read };
  });
}

export default function GlassBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, openAuth, user, logout } = useAuth() as {
    isLoggedIn: boolean;
    openAuth: () => void;
    user?: any;
    logout?: () => void;
  };

  const [statusModalOpen, setStatusModalOpen] = useState(false);

  // ---- Notification Sheet State ----
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NormalizedNotification[]>([]);
  const key = useMemo(() => {
    const id = user?.id ?? user?.civilianId ?? user?.userId ?? 'guest';
    return `c-${id}-notification`;
  }, [user]);

  const loadNotifications = () => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      if (!raw) {
        setNotifications([]);
        return;
      }
      const parsed = JSON.parse(raw);
      setNotifications(normalizeNotifications(parsed));
    } catch {
      setNotifications([]);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') loadNotifications();
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) loadNotifications();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const unreadCount = useMemo(() => {
    const unread = notifications.filter((n) => n.read === false).length;
    return unread > 0 ? unread : notifications.length;
  }, [notifications]);

  // ---- Profile Menu (anchored above the Profile button) ----
  const [profileOpen, setProfileOpen] = useState(false);
  const profileItemRef = useRef<HTMLLIElement | null>(null);
  const onGlobalClick = (e: MouseEvent) => {
    if (!profileItemRef.current) return;
    if (!profileItemRef.current.contains(e.target as Node)) setProfileOpen(false);
  };
  const onGlobalKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') setProfileOpen(false);
  };
  useEffect(() => {
    if (!profileOpen) return;
    document.addEventListener('click', onGlobalClick);
    document.addEventListener('keydown', onGlobalKey);
    return () => {
      document.removeEventListener('click', onGlobalClick);
      document.removeEventListener('keydown', onGlobalKey);
    };
  }, [profileOpen]);

  const handleLogout = () => {
    try {
      logout?.();
    } finally {
      setProfileOpen(false);
      router.push('/');
    }
  };

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed left-1/2 z-50 -translate-x-1/2 bottom-[calc(env(safe-area-inset-bottom,0)+1rem)]"
      >
        <ul className="flex items-center gap-2 rounded-3xl border border-white/25 bg-white/30 p-3 shadow-lg ring-1 ring-black/5 backdrop-blur-xl supports-[backdrop-filter]:bg-white/20 dark:bg-slate-900/30 dark:border-white/10 dark:ring-white/10">
          {NAV.map(({ href, label, Icon, color }) => {
            const isNotification = href === '/notification';
            const isProfile = href === '/profile';
            const active =
              !isNotification &&
              !isProfile &&
              (pathname === href || (href !== '/' && pathname.startsWith(`${href}`)));

            // Notifications: open bottom sheet (no navigation)
            if (isNotification) {
              const onClick = (e: React.MouseEvent) => {
                e.preventDefault();
                loadNotifications();
                setNotifOpen(true);
              };

              const activeColor = colorMap[color].active;
              const idleColor = `text-slate-700 dark:text-slate-100 ${colorMap[color].hover}`;

              return (
                <li key={href}>
                  <button
                    onClick={onClick}
                    className="group relative block"
                    aria-haspopup="dialog"
                    aria-expanded={notifOpen}
                  >
                    <div
                      className={`pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium opacity-0 shadow-md transition-all duration-200 sm:hidden ${colorMap[color].tooltip} group-hover:opacity-100`}
                    >
                      {label}
                    </div>
                    <div
                      className={[
                        'relative',
                        'flex flex-col items-center sm:flex-row sm:items-center gap-1 sm:gap-2',
                        'rounded-2xl px-3 py-2 text-sm transition-all duration-200',
                        notifOpen ? activeColor : idleColor,
                      ].join(' ')}
                    >
                      <span className="relative">
                        <Icon
                          className={`h-5 w-5 transition-colors ${
                            notifOpen ? 'text-white' : 'text-slate-700 dark:text-slate-100'
                          }`}
                        />
                        <NotificationLabel count={unreadCount} />
                      </span>
                      <span
                        className={[
                          'hidden sm:inline-block text-[12px] font-medium',
                          'overflow-hidden whitespace-nowrap',
                          'max-w-0 opacity-0 translate-x-1',
                          'transition-all duration-200',
                          'group-hover:max-w-[120px] group-hover:opacity-100 group-hover:translate-x-0',
                          notifOpen ? 'max-w-[120px] opacity-100 translate-x-0 text-white' : 'text-slate-700 dark:text-slate-100',
                        ].join(' ')}
                      >
                        {label}
                      </span>
                    </div>
                  </button>
                </li>
              );
            }

            // Profile: anchored menu right above the button
            if (isProfile) {
              const activeColor = colorMap[color].active;
              const idleColor = `text-slate-700 dark:text-slate-100 ${colorMap[color].hover}`;

              const onClick = (e: React.MouseEvent) => {
                e.preventDefault();
                if (!isLoggedIn) {
                  openAuth();
                  return;
                }
                setProfileOpen((v) => !v);
              };

              return (
                <li key={href} ref={profileItemRef} className="relative">
                  <button
                    onClick={onClick}
                    className="group relative block"
                    aria-haspopup="menu"
                    aria-expanded={profileOpen}
                    aria-controls="profile-menu"
                  >
                    <div
                      className={`pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium opacity-0 shadow-md transition-all duration-200 sm:hidden ${colorMap[color].tooltip} group-hover:opacity-100`}
                    >
                      {label}
                    </div>

                    <div
                      className={[
                        'flex flex-col items-center sm:flex-row sm:items-center gap-1 sm:gap-2',
                        'rounded-2xl px-3 py-2 text-sm transition-all duration-200',
                        profileOpen ? activeColor : idleColor,
                      ].join(' ')}
                    >
                      <Icon
                        className={`h-5 w-5 transition-colors ${
                          profileOpen ? 'text-white' : 'text-slate-700 dark:text-slate-100'
                        }`}
                      />
                      <span
                        className={[
                          'hidden sm:inline-block text-[12px] font-medium',
                          'overflow-hidden whitespace-nowrap',
                          'max-w-0 opacity-0 translate-x-1',
                          'transition-all duration-200',
                          'group-hover:max-w-[120px] group-hover:opacity-100 group-hover:translate-x-0',
                          profileOpen ? 'max-w-[120px] opacity-100 translate-x-0 text-white' : 'text-slate-700 dark:text-slate-100',
                        ].join(' ')}
                      >
                        {label}
                      </span>
                    </div>
                  </button>

                  {/* Anchored menu */}
                  {profileOpen && (
                    <div
                      id="profile-menu"
                      role="menu"
                      aria-label="Profile menu"
                      className="absolute bottom-[calc(100%+10px)] right-0 min-w-[220px] rounded-2xl border border-white/25 bg-white/80 p-2 shadow-xl ring-1 ring-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80 dark:ring-white/10"
                    >
                      {/* Arrow */}
                      <div className="pointer-events-none absolute -bottom-2 right-6 h-4 w-4 rotate-45 rounded-sm bg-white/80 ring-1 ring-black/5 dark:bg-slate-900/80 dark:ring-white/10" />

                      <button
                        role="menuitem"
                        onClick={() => {
                          setProfileOpen(false);
                          router.push('/profile');
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-800 hover:bg-slate-100 focus:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800 dark:focus:bg-slate-800"
                      >
                        <User className="h-4 w-4" />
                        <span className="font-medium">Account</span>
                      </button>

                      <button
                        role="menuitem"
                        onClick={() => {
                          setProfileOpen(false);
                          setStatusModalOpen(true); // Open the Civilian Status Request modal
                        }}
                        className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-800 hover:bg-slate-100 focus:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800 dark:focus:bg-slate-800"
                      >
                        <ClipboardList className="h-4 w-4" />
                        <span className="font-medium">Status Request</span>
                      </button>

                      <button
                        role="menuitem"
                        onClick={handleLogout}
                        className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-rose-700 hover:bg-rose-50 focus:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-900/40 dark:focus:bg-rose-900/40"
                      >
                        <LogOut className="h-4 w-4" />
                        <span className="font-medium">Logout</span>
                      </button>
                    </div>
                  )}
                </li>
              );
            }

            // Default link items
            return (
              <li key={href}>
                <Link href={href} className="group relative block" aria-current={active ? 'page' : undefined}>
                  <div
                    className={`pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium opacity-0 shadow-md transition-all duration-200 sm:hidden ${colorMap[color].tooltip} group-hover:opacity-100`}
                  >
                    {label}
                  </div>
                  <div
                    className={[
                      'flex flex-col items-center sm:flex-row sm:items-center gap-1 sm:gap-2',
                      'rounded-2xl px-3 py-2 text-sm transition-all duration-200',
                      active ? colorMap[color].active : `text-slate-700 dark:text-slate-100 ${colorMap[color].hover}`,
                    ].join(' ')}
                  >
                    <Icon
                      className={`h-5 w-5 transition-colors ${
                        active ? 'text-white' : 'text-slate-700 dark:text-slate-100'
                      }`}
                    />
                    <span
                      className={[
                        'hidden sm:inline-block text-[12px] font-medium',
                        'overflow-hidden whitespace-nowrap',
                        'max-w-0 opacity-0 translate-x-1',
                        'transition-all duration-200',
                        'group-hover:max-w-[120px] group-hover:opacity-100 group-hover:translate-x-0',
                        active ? 'max-w-[120px] opacity-100 translate-x-0 text-white' : 'text-slate-700 dark:text-slate-100',
                      ].join(' ')}
                    >
                      {label}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Notification Bottom Sheet */}
      <BottomSheet open={notifOpen} onClose={() => setNotifOpen(false)} title="Notifications">
        {notifications.length === 0 ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <Bell className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">No notifications yet.</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">We’ll show updates here as they arrive.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
            {notifications.map((n) => (
              <li key={n.id} className="flex items-start gap-3 bg-white/60 p-3 backdrop-blur-sm dark:bg-slate-900/60">
                <div className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-rose-500/90" aria-hidden />
                <div className="min-w-0">
                  {n.title && (
                    <p className="truncate text-[13px] font-semibold text-slate-800 dark:text-slate-100">{n.title}</p>
                  )}
                  <p className="text-[13px] text-slate-700 dark:text-slate-200">{n.message}</p>
                  {n.createdAt && (
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </BottomSheet>

      <CivilianStatusModal
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        initialMode="request"
        civilianIdKey="resq_civilian"
        onRequested={(msg) => console.log('Status request submitted:', msg)}
      />
    </>
  );
}
