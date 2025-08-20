// components/shared/GlassBottomNav.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { Home, Heart, Search, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

type NavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
  color: 'violet' | 'pink' | 'amber' | 'cyan';
};

const NAV: NavItem[] = [
  { href: '/',          label: 'Home',       Icon: Home,  color: 'violet' },
  { href: '/first-aid', label: 'First Aids', Icon: Heart, color: 'pink'   },
  { href: '/snakes',    label: 'Snakes',     Icon: Search,color: 'amber'  },
  { href: '/request',   label: 'Request',    Icon: Search,color: 'amber'  },
  { href: '/notification',   label: 'notification',    Icon: Search,color: 'amber'  },
  { href: '/profile',   label: 'Profile',    Icon: User,  color: 'cyan'   },
];

const colorMap = {
  violet: { active: 'bg-violet-500 text-white', hover: 'group-hover:bg-violet-100/80', tooltip: 'bg-violet-500 text-white' },
  pink:   { active: 'bg-pink-500 text-white',   hover: 'group-hover:bg-pink-100/80',   tooltip: 'bg-pink-500 text-white'   },
  amber:  { active: 'bg-amber-400 text-slate-900', hover: 'group-hover:bg-amber-100/80', tooltip: 'bg-amber-400 text-slate-900' },
  cyan:   { active: 'bg-cyan-500 text-white',   hover: 'group-hover:bg-cyan-100/80',   tooltip: 'bg-cyan-500 text-white'   },
};

export default function GlassBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, openAuth } = useAuth();

  return (
    <nav aria-label="Primary" className="fixed left-1/2 z-50 -translate-x-1/2 bottom-[calc(env(safe-area-inset-bottom,0)+1rem)]">
      <ul className="flex items-center gap-2 rounded-3xl border border-white/25 bg-white/30 p-2 shadow-lg ring-1 ring-black/5 backdrop-blur-xl supports-[backdrop-filter]:bg-white/20 dark:bg-slate-900/30 dark:border-white/10 dark:ring-white/10">
        {NAV.map(({ href, label, Icon, color }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(`${href}`));

          // Special handling for Profile
          if (href === '/profile') {
            const onClick = (e: React.MouseEvent) => {
              e.preventDefault();
              if (isLoggedIn) router.push('/profile');
              else openAuth();
            };

            return (
              <li key={href}>
                <button onClick={onClick} className="group relative block">
                  {/* tooltip on mobile */}
                  <div className={`pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium opacity-0 shadow-md transition-all duration-200 sm:hidden ${colorMap[color].tooltip} group-hover:opacity-100`}>
                    {label}
                  </div>

                  <div
                    className={[
                      'flex flex-col items-center sm:flex-row sm:items-center gap-1 sm:gap-2',
                      'rounded-2xl px-3 py-2 text-sm transition-all duration-200',
                      active ? colorMap[color].active : `text-slate-700 dark:text-slate-100 ${colorMap[color].hover}`,
                    ].join(' ')}
                  >
                    <Icon className={`h-5 w-5 transition-colors ${active ? 'text-white' : 'text-slate-700 dark:text-slate-100'}`} />
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
                </button>
              </li>
            );
          }

          // Default link items
          return (
            <li key={href}>
              <Link href={href} className="group relative block" aria-current={active ? 'page' : undefined}>
                <div className={`pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium opacity-0 shadow-md transition-all duration-200 sm:hidden ${colorMap[color].tooltip} group-hover:opacity-100`}>
                  {label}
                </div>
                <div
                  className={[
                    'flex flex-col items-center sm:flex-row sm:items-center gap-1 sm:gap-2',
                    'rounded-2xl px-3 py-2 text-sm transition-all duration-200',
                    active ? colorMap[color].active : `text-slate-700 dark:text-slate-100 ${colorMap[color].hover}`,
                  ].join(' ')}
                >
                  <Icon className={`h-5 w-5 transition-colors ${active ? 'text-white' : 'text-slate-700 dark:text-slate-100'}`} />
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
  );
}
