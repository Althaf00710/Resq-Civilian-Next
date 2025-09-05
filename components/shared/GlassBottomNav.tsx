// components/shared/GlassBottomNav.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Home,
  Worm,
  Ambulance,
  User,
  Bell,
  ClipboardList,
  LogOut,
  BriefcaseMedical,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import BottomSheet from "../ui/Notification/BottomSheet";
import NotificationLabel from "../ui/Notification/NotificationLabel";
import CivilianStatusModal from "@/components-page/profile/CivilianStatusModal";
import ProfileCard, { Civilian } from "@/components-page/profile/ProfileCard";
import { LoginCivilian } from "@/graphql/types/civilian";

/* --------------------------- Types & constants --------------------------- */

type NavColor = "violet" | "rose" | "emerald" | "amber" | "indigo" | "cyan";

type NavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
  color: NavColor;
};

type AnyNotif =
  | string
  | {
      id?: string | number;
      title?: string;
      message?: string;
      text?: string;
      createdAt?: string;
      read?: boolean;
    };

type NormalizedNotification = {
  id: string;
  title?: string;
  message: string;
  createdAt?: string;
  read?: boolean;
};

const CIVILIAN_KEY = "resq_civilian";

/* --------------------------------- Data --------------------------------- */

const NAV: NavItem[] = [
  { href: "/", label: "Home", Icon: Home, color: "violet" },
  { href: "/first-aids", label: "First Aids", Icon: BriefcaseMedical, color: "rose" },
  { href: "/snakes", label: "Snakes", Icon: Worm, color: "emerald" },
  { href: "/request", label: "Request", Icon: Ambulance, color: "amber" },
  { href: "/notification", label: "Notifications", Icon: Bell, color: "indigo" },
  { href: "/profile", label: "Profile", Icon: User, color: "cyan" },
];

const colorMap: Record<NavColor, { active: string; hover: string; tooltip: string }> = {
  violet: {
    active: "bg-violet-500 text-white",
    hover: "group-hover:bg-violet-300/80",
    tooltip: "bg-violet-500 text-white",
  },
  rose: {
    active: "bg-rose-500 text-white",
    hover: "group-hover:bg-rose-300/80",
    tooltip: "bg-rose-500 text-white",
  },
  emerald: {
    active: "bg-emerald-500 text-white",
    hover: "group-hover:bg-emerald-300/80",
    tooltip: "bg-emerald-500 text-white",
  },
  amber: {
    active: "bg-amber-400 text-slate-900",
    hover: "group-hover:bg-amber-300/80",
    tooltip: "bg-amber-400 text-slate-900",
  },
  indigo: {
    active: "bg-indigo-500 text-white",
    hover: "group-hover:bg-indigo-300/80",
    tooltip: "bg-indigo-500 text-white",
  },
  cyan: {
    active: "bg-cyan-500 text-white",
    hover: "group-hover:bg-cyan-300/80",
    tooltip: "bg-cyan-500 text-white",
  },
};

/* ---------------------------- Helper functions --------------------------- */

function normalizeNotifications(raw: unknown): NormalizedNotification[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((n: AnyNotif, idx) => {
    if (typeof n === "string") return { id: String(idx), message: n };
    const msg = n.message ?? n.text ?? "";
    const ttl = n.title ?? undefined;
    const created = typeof n.createdAt === "string" ? n.createdAt : undefined;
    const read = typeof n.read === "boolean" ? n.read : undefined;
    const id = n.id != null ? String(n.id) : String(idx);
    return { id, title: ttl, message: msg || "(no message)", createdAt: created, read };
  });
}

// parse localStorage that might be single- or double-stringified
function parseJsonSafe<T = unknown>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    const first = JSON.parse(raw);
    return typeof first === "string" ? JSON.parse(first) : first;
  } catch {
    return null;
  }
}

/* --------------------------------- View ---------------------------------- */

export default function GlassBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const { isLoggedIn, openAuth, user, logout } = useAuth() as {
    isLoggedIn: boolean;
    openAuth: () => void;
    user?: LoginCivilian | any;
    logout?: () => void;
  };

  const [statusModalOpen, setStatusModalOpen] = useState(false);

  /* ---- Civilian from localStorage (robust to different stored shapes) ---- */
  const [civilianLS, setCivilianLS] = useState<LoginCivilian | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const readCivilian = () => {
      const raw = localStorage.getItem(CIVILIAN_KEY);
      const parsed = parseJsonSafe<any>(raw);
      const c = parsed?.loginCivilian?.civilian ?? parsed;
      if (!c || typeof c !== "object") return setCivilianLS(null);
      setCivilianLS({
        id: Number(c.id),
        name: String(c.name ?? ""),
        email: String(c.email ?? ""),
        phoneNumber: String(c.phoneNumber ?? ""),
        nicNumber: String(c.nicNumber ?? ""),
        joinedDate: String(c.joinedDate ?? new Date().toISOString()),
        isRestrict: Boolean(c.isRestrict),
        civilianStatusId: Number(c.civilianStatusId ?? 0),
        civilianStatus: { role: String(c.civilianStatus?.role ?? "Civilian") },
      });
    };

    readCivilian();
    const onStorage = (e: StorageEvent) => {
      if (e.key === CIVILIAN_KEY) readCivilian();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /* --------------------------- Notifications sheet --------------------------- */
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NormalizedNotification[]>([]);

  // Stable key for this user's notifications
  const key = useMemo(() => {
    const id =
      civilianLS?.id ??
      user?.id ??
      (user as any)?.civilianId ??
      (user as any)?.userId ??
      "guest";
    return `c-${id}-notification`;
  }, [civilianLS?.id, user]);

  const loadNotifications = () => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(key) : null;
      if (!raw) return setNotifications([]);
      setNotifications(normalizeNotifications(JSON.parse(raw)));
    } catch {
      setNotifications([]);
    }
  };

  // Keep state in sync when LS changes (subscriber writes and emits this event)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { key?: string } | undefined;
      if (!detail || detail.key !== key) return;
      loadNotifications();
    };
    window.addEventListener("resq:notifications-changed", handler as EventListener);
    return () =>
      window.removeEventListener("resq:notifications-changed", handler as EventListener);
  }, [key]);

  // Push listener for instant UI update (filtered by this user's key)
  useEffect(() => {
    const handlePushNotification = (e: Event) => {
      const detail = (e as CustomEvent).detail as { key?: string; item?: AnyNotif } | undefined;
      if (!detail?.item || detail.key !== key) return;

      const normalized = normalizeNotifications([detail.item]);
      if (normalized.length === 0) return;

      setNotifications((prev) => {
        const n0 = normalized[0];
        if (prev.some((n) => n.id === n0.id)) return prev;
        return [n0, ...prev].slice(0, 50);
      });

      setNotifOpen(true);
    };

    window.addEventListener("resq:notification-push", handlePushNotification as EventListener);
    return () =>
      window.removeEventListener("resq:notification-push", handlePushNotification as EventListener);
  }, [key]);

  // Initial load + react to native storage change (e.g., other tabs)
  useEffect(() => {
    if (typeof window !== "undefined") loadNotifications();
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) loadNotifications();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const unreadCount = useMemo(() => {
    const unread = notifications.filter((n) => n.read === false).length;
    return unread > 0 ? unread : notifications.length;
  }, [notifications]);

  /* ---------------------------- Profile menu state ---------------------------- */

  const [profileOpen, setProfileOpen] = useState(false);
  const profileItemRef = useRef<HTMLLIElement | null>(null);

  const onGlobalClick = (e: MouseEvent) => {
    if (!profileItemRef.current) return;
    if (!profileItemRef.current.contains(e.target as Node)) setProfileOpen(false);
  };
  const onGlobalKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") setProfileOpen(false);
  };
  useEffect(() => {
    if (!profileOpen) return;
    document.addEventListener("click", onGlobalClick);
    document.addEventListener("keydown", onGlobalKey);
    return () => {
      document.removeEventListener("click", onGlobalClick);
      document.removeEventListener("keydown", onGlobalKey);
    };
  }, [profileOpen]);

  const handleLogout = () => {
    try {
      logout?.();
    } finally {
      setProfileOpen(false);
      router.push("/");
    }
  };

  /* --------------------------- Account sheet/profile -------------------------- */

  const [accountOpen, setAccountOpen] = useState(false);

  const civilianProfile: Civilian = useMemo(
    () => ({
      name:
        civilianLS?.name ??
        user?.name ??
        (user as any)?.fullName ??
        (user as any)?.displayName ??
        "Unknown User",
      email: civilianLS?.email ?? user?.email ?? "—",
      phoneNumber:
        civilianLS?.phoneNumber ??
        user?.phoneNumber ??
        (user as any)?.phone ??
        "—",
      nicNumber:
        civilianLS?.nicNumber ??
        (user as any)?.nicNumber ??
        (user as any)?.nic ??
        "—",
      joinedDate:
        civilianLS?.joinedDate ??
        (user as any)?.joinedDate ??
        (user as any)?.createdAt ??
        new Date(),
      civilianStatus: {
        role:
          civilianLS?.civilianStatus?.role ??
          (user as any)?.civilianStatus?.role ??
          (user as any)?.role ??
          "Civilian",
      },
      avatarUrl: (user as any)?.avatarUrl ?? (user as any)?.avatar ?? undefined,
    }),
    [civilianLS, user]
  );

  /* --------------------------------- Render --------------------------------- */

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed left-1/2 z-50 -translate-x-1/2 bottom-[calc(env(safe-area-inset-bottom,0)+1rem)]"
      >
        <ul className="flex items-center gap-2 rounded-3xl border border-white/25 bg-white/30 p-3 shadow-lg ring-1 ring-black/5 backdrop-blur-xl supports-[backdrop-filter]:bg-white/20 dark:bg-slate-900/30 dark:border-white/10 dark:ring-white/10">
          {NAV.map(({ href, label, Icon, color }) => {
            const isNotification = href === "/notification";
            const isProfile = href === "/profile";
            const active =
              !isNotification &&
              !isProfile &&
              (pathname === href ||
                (href !== "/" && pathname.startsWith(`${href}`)));

            // Notifications button: opens the sheet (state stays in sync via events)
            if (isNotification) {
              const onClick = (e: React.MouseEvent) => {
                e.preventDefault();
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
                        "relative",
                        "flex flex-col items-center sm:flex-row sm:items-center gap-1 sm:gap-2",
                        "rounded-2xl px-3 py-2 text-sm transition-all duration-200",
                        notifOpen ? activeColor : idleColor,
                      ].join(" ")}
                    >
                      <span className="relative">
                        <Icon
                          className={`h-5 w-5 transition-colors ${
                            notifOpen
                              ? "text-white"
                              : "text-slate-700 dark:text-slate-100"
                          }`}
                        />
                        <NotificationLabel count={unreadCount} />
                      </span>
                      <span
                        className={[
                          "hidden sm:inline-block text-[12px] font-medium",
                          "overflow-hidden whitespace-nowrap",
                          "max-w-0 opacity-0 translate-x-1",
                          "transition-all duration-200",
                          "group-hover:max-w-[120px] group-hover:opacity-100 group-hover:translate-x-0",
                          notifOpen
                            ? "max-w-[120px] opacity-100 translate-x-0 text-white"
                            : "text-slate-700 dark:text-slate-100",
                        ].join(" ")}
                      >
                        {label}
                      </span>
                    </div>
                  </button>
                </li>
              );
            }

            // Profile: anchored menu above the button
            if (isProfile) {
              const activeColor = colorMap[color].active;
              const idleColor = `text-slate-700 dark:text-slate-100 ${colorMap[color].hover}`;

              const onClick = (e: React.MouseEvent) => {
                e.preventDefault();
                if (!isLoggedIn) return openAuth();
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
                        "flex flex-col items-center sm:flex-row sm:items-center gap-1 sm:gap-2",
                        "rounded-2xl px-3 py-2 text-sm transition-all duration-200",
                        profileOpen ? activeColor : idleColor,
                      ].join(" ")}
                    >
                      <Icon
                        className={`h-5 w-5 transition-colors ${
                          profileOpen
                            ? "text-white"
                            : "text-slate-700 dark:text-slate-100"
                        }`}
                      />
                      <span
                        className={[
                          "hidden sm:inline-block text-[12px] font-medium",
                          "overflow-hidden whitespace-nowrap",
                          "max-w-0 opacity-0 translate-x-1",
                          "transition-all duration-200",
                          "group-hover:max-w-[120px] group-hover:opacity-100 group-hover:translate-x-0",
                          profileOpen
                            ? "max-w-[120px] opacity-100 translate-x-0 text-white"
                            : "text-slate-700 dark:text-slate-100",
                        ].join(" ")}
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
                          setAccountOpen(true);
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
                          setStatusModalOpen(true);
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

            // Default items
            return (
              <li key={href}>
                <Link href={href} className="group relative block" aria-current={active ? "page" : undefined}>
                  <div
                    className={`pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium opacity-0 shadow-md transition-all duration-200 sm:hidden ${colorMap[color].tooltip} group-hover:opacity-100`}
                  >
                    {label}
                  </div>
                  <div
                    className={[
                      "flex flex-col items-center sm:flex-row sm:items-center gap-1 sm:gap-2",
                      "rounded-2xl px-3 py-2 text-sm transition-all duration-200",
                      active
                        ? colorMap[color].active
                        : `text-slate-700 dark:text-slate-100 ${colorMap[color].hover}`,
                    ].join(" ")}
                  >
                    <Icon
                      className={`h-5 w-5 transition-colors ${
                        active ? "text-white" : "text-slate-700 dark:text-slate-100"
                      }`}
                    />
                    <span
                      className={[
                        "hidden sm:inline-block text-[12px] font-semibold",
                        "overflow-hidden whitespace-nowrap",
                        "max-w-0 opacity-0 translate-x-1",
                        "transition-all duration-200",
                        "group-hover:max-w-[120px] group-hover:opacity-100 group-hover:translate-x-0",
                        active
                          ? "max-w-[120px] opacity-100 translate-x-0 text-white"
                          : "text-slate-700 dark:text-slate-100",
                      ].join(" ")}
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
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              We’ll show updates here as they arrive.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
            {notifications.map((n) => (
              <li key={n.id} className="flex items-start gap-3 bg-white/60 p-3 backdrop-blur-sm dark:bg-slate-900/60">
                <div className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-rose-500/90" aria-hidden />
                <div className="min-w-0">
                  {n.title && (
                    <p className="truncate text-[13px] font-semibold text-slate-800 dark:text-slate-100">
                      {n.title}
                    </p>
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

      {/* Account Bottom Sheet with ProfileCard */}
      <BottomSheet open={accountOpen} onClose={() => setAccountOpen(false)} title=" ">
        <ProfileCard civilian={civilianProfile} />
      </BottomSheet>

      <CivilianStatusModal
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        initialMode="request"
        civilianIdKey={CIVILIAN_KEY}
        onRequested={(msg) => console.log("Status request submitted:", msg)}
      />
    </>
  );
}
