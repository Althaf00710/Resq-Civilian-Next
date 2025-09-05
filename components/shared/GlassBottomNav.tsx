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
  MapPin,
  HeartPulse,
  User as UserIcon,
  Phone as PhoneIcon,
  Navigation,
  ExternalLink,
  X,
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
      type?: string;
      meta?: {
        emergencyId?: string;
        categoryName?: string | null;
        address?: string | null;
        civilianName?: string | null;
        phoneNumber?: string | null;
        latitude?: number;
        longitude?: number;
        description?: string | null;
      };
    };

type NormalizedNotification = {
  id: string;
  title?: string;
  message: string;
  createdAt?: string;
  read?: boolean;
  type?: string;
  meta?: {
    emergencyId?: string;
    categoryName?: string | null;
    address?: string | null;
    civilianName?: string | null;
    phoneNumber?: string | null;
    latitude?: number;
    longitude?: number;
    description?: string | null;
  };
};

const CIVILIAN_KEY = "resq_civilian";
const NEXT_PUBLIC_GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

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
    const type = (n as any)?.type ?? undefined;
    const meta = (n as any)?.meta ?? undefined;
    return { id, title: ttl, message: msg || "(no message)", createdAt: created, read, type, meta };
  });
}

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

  /* ---- Civilian from localStorage ---- */
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

  /* ------------------------- Directions modal state ------------------------- */
  type Dest = {
    lat: number;
    lng: number;
    address?: string | null;
    category?: string | null;
    civilianName?: string | null;
    phone?: string | null;
  };

  const [directionsOpen, setDirectionsOpen] = useState(false);
  const [dest, setDest] = useState<Dest | null>(null);
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);

  // Resolve current location when directions modal opens
  useEffect(() => {
    if (!directionsOpen) return;
    if (!("geolocation" in navigator)) return;

    const id = navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        // ignore errors; we'll fall back to external buttons
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
    return () => {
      try {
        // nothing to clear in getCurrentPosition
      } catch {}
    };
  }, [directionsOpen]);

  // Mark as read in LS & state
  const markNotificationRead = (id: string) => {
    try {
      const currentRaw = localStorage.getItem(key);
      const current = currentRaw ? JSON.parse(currentRaw) : [];
      const next = Array.isArray(current)
        ? current.map((n: any) => (String(n.id) === id ? { ...n, read: true } : n))
        : current;
      localStorage.setItem(key, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent("resq:notifications-changed", { detail: { key } }));
    } catch {}
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  // Click handler to open directions
  const onNotificationClick = (n: NormalizedNotification) => {
    if (n.type === "nearby-emergency") {
      const lat = n.meta?.latitude;
      const lng = n.meta?.longitude;
      if (typeof lat === "number" && typeof lng === "number") {
        setDest({
          lat,
          lng,
          address: n.meta?.address ?? null,
          category: n.meta?.categoryName ?? n.message ?? null,
          civilianName: n.meta?.civilianName ?? null,
          phone: n.meta?.phoneNumber ?? null,
        });
        setNotifOpen(false);
        setDirectionsOpen(true);
        markNotificationRead(n.id);
      }
    }
  };

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
        (civilianLS?.joinedDate as any) ??
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
            {notifications.map((n) => {
              const isNearby = n.type === "nearby-emergency";
              const cat = n.meta?.categoryName ?? n.message;
              const addr = n.meta?.address ?? "";
              const civName = n.meta?.civilianName ?? "";
              const phone = n.meta?.phoneNumber ?? "";
              const clickable = isNearby && typeof n.meta?.latitude === "number" && typeof n.meta?.longitude === "number";

              return (
                <li key={n.id}>
                  <button
                    className="w-full text-left bg-white/60 backdrop-blur-sm dark:bg-slate-900/60 p-3 hover:bg-white/80 dark:hover:bg-slate-900/80 transition"
                    onClick={() => clickable && onNotificationClick(n)}
                    disabled={!clickable}
                    aria-disabled={!clickable}
                  >
                    {isNearby ? (
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-rose-500/10 ring-1 ring-rose-200 dark:ring-rose-800">
                          <HeartPulse className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-slate-900 dark:text-slate-50">
                            {n.title ?? "Someone near needs your help"}
                          </p>

                          {cat && (
                            <div className="mt-1 flex items-center gap-2 text-[13px] text-slate-800 dark:text-slate-200">
                              <HeartPulse className="h-4 w-4 opacity-80" />
                              <span className="truncate">{cat}</span>
                            </div>
                          )}

                          {addr && (
                            <div className="mt-1 flex items-center gap-2 text-[13px] text-slate-800 dark:text-slate-200">
                              <MapPin className="h-4 w-4 opacity-80" />
                              <span className="line-clamp-2">{addr}</span>
                            </div>
                          )}

                          {civName && (
                            <div className="mt-1 flex items-center gap-2 text-[13px] text-slate-800 dark:text-slate-200">
                              <UserIcon className="h-4 w-4 opacity-80" />
                              <span className="truncate">{civName}</span>
                            </div>
                          )}

                          {phone && (
                            <div className="mt-1 flex items-center gap-2 text-[13px] text-slate-800 dark:text-slate-200">
                              <PhoneIcon className="h-4 w-4 opacity-80" />
                              <a className="underline decoration-dotted" href={`tel:${phone}`}>
                                {phone}
                              </a>
                            </div>
                          )}

                          {n.createdAt && (
                            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                              {new Date(n.createdAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
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
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </BottomSheet>

      {/* Directions Modal */}
      <DirectionsModal
        open={directionsOpen}
        onClose={() => setDirectionsOpen(false)}
        dest={dest}
        origin={origin}
      />

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

/* ----------------------------- Directions Modal ----------------------------- */

function DirectionsModal({
  open,
  onClose,
  dest,
  origin,
}: {
  open: boolean;
  onClose: () => void;
  dest: { lat: number; lng: number; address?: string | null; category?: string | null; civilianName?: string | null; phone?: string | null } | null;
  origin: { lat: number; lng: number } | null;
}) {
  if (!open || !dest) return null;

  const hasEmbed = Boolean(NEXT_PUBLIC_GOOGLE_API_KEY && origin);
  const destQ = `${dest.lat},${dest.lng}`;
  const originQ = origin ? `${origin.lat},${origin.lng}` : "Current+Location";

  const gmapsEmbed = hasEmbed
    ? `https://www.google.com/maps/embed/v1/directions?key=${NEXT_PUBLIC_GOOGLE_API_KEY}&origin=${encodeURIComponent(
        originQ
      )}&destination=${encodeURIComponent(destQ)}&mode=driving`
    : null;

  const gmapsExternal = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    destQ
  )}&travelmode=driving${origin ? `&origin=${encodeURIComponent(originQ)}` : ""}&dir_action=navigate`;

  const appleMaps = `http://maps.apple.com/?daddr=${encodeURIComponent(destQ)}&dirflg=d`;

  return (
    <div className="fixed inset-0 z-[1600]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        className="absolute left-1/2 top-1/2 w-[min(920px,92vw)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 dark:bg-slate-900 dark:ring-white/10"
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-3 dark:border-slate-800">
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Directions to {dest.category ?? "Emergency"}
            </div>
            {dest.address && (
              <div className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
                <MapPin className="mr-1 inline-block h-3.5 w-3.5" />
                {dest.address}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Map area */}
        <div className="aspect-[16/10] w-full bg-slate-100 dark:bg-slate-800">
          {gmapsEmbed ? (
            <iframe
              title="Directions"
              src={gmapsEmbed}
              className="h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            // Fallback preview pin if no embed key or no geolocation
            <iframe
              title="Map preview"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(destQ)}&z=15&output=embed`}
              className="h-full w-full border-0"
              loading="lazy"
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-3 dark:border-slate-800">
          <div className="text-xs text-slate-600 dark:text-slate-300">
            {origin ? "Using your current location for directions." : "We’ll open your maps app for live navigation."}
          </div>
          <div className="flex items-center gap-2">
            <a
              href={gmapsExternal}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Navigation className="h-4 w-4" />
              Open in Google Maps
            </a>
            <a
              href={appleMaps}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-300 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
            >
              <ExternalLink className="h-4 w-4" />
              Open in Apple Maps
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
