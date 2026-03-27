import { useState, useEffect, useCallback, type ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { Search, Menu, X, Telescope } from "lucide-react";
import type { Status } from "./launchData";
import { STATUS_LABELS, STATUS_DOT_COLORS, AGENCY_COLORS } from "./launchData";
import type { APIStatus, APIAgency } from "../../services/types";
import { getStatusConfig, getAgencyAbbrev, getAgencyColor } from "../../services/formatters";

/* ─── Design Tokens (JS mirror of theme.css) ─── */
export const DS = {
  bg: "#0a0a0f",
  surface: "#0d1b2a",
  card: "#131f30",
  primary: "#ff6b35",
  secondary: "#4fc3f7",
  success: "#00e676",
  warning: "#ffc107",
  error: "#ff1744",
  textHeading: "#ffffff",
  textBody: "#b0bec5",
  textMuted: "#546e7a",
  border: "rgba(255,255,255,0.05)",
  borderHover: "rgba(79,195,247,0.4)",
  glowPrimary: "rgba(255,107,53,0.6)",
  glowSecondary: "rgba(79,195,247,0.4)",
  glass: "rgba(13,27,42,0.6)",
  glassCard: "rgba(19,31,48,0.7)",
  fontHeading: "Orbitron, monospace",
  fontBody: "Inter, sans-serif",
  pageGradient: "linear-gradient(180deg, #0a0a0f 0%, #0d1b2a 40%, #0a0a0f 100%)",
  cardGradient: "linear-gradient(135deg, rgba(19,31,48,0.7), rgba(10,10,15,0.9))",
} as const;

/* ─── Hooks ─── */
export function useCountdown(target: Date) {
  const calc = useCallback(() => {
    const diff = Math.max(0, target.getTime() - Date.now());
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  }, [target]);
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [calc]);
  return time;
}

/* ─── Status Chip (5 variants) ─── */
const STATUS_CHIP_STYLES: Record<Status, string> = {
  GO: "bg-[#00e676]/12 text-[#00e676] border-[#00e676]/25",
  TBD: "bg-[#ffc107]/12 text-[#ffc107] border-[#ffc107]/25",
  HOLD: "bg-[#ff1744]/12 text-[#ff1744] border-[#ff1744]/25",
  COMPLETED: "bg-[#78909c]/12 text-[#78909c] border-[#78909c]/25",
  IN_FLIGHT: "bg-[#4fc3f7]/12 text-[#4fc3f7] border-[#4fc3f7]/25",
};

export function StatusChip({ status }: { status: Status }) {
  const isInFlight = status === "IN_FLIGHT";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] tracking-widest border ${STATUS_CHIP_STYLES[status]} ${isInFlight ? "lp-pulse-blue" : ""}`}
      style={{ fontFamily: DS.fontHeading }}
    >
      {isInFlight && <span className="w-1.5 h-1.5 rounded-full bg-[#4fc3f7] lp-live-dot" />}
      {STATUS_LABELS[status]}
    </span>
  );
}

/* ─── Countdown Timer — Large & Compact ─── */
export function CountdownBlock({ value, label, size = "lg" }: { value: number; label: string; size?: "lg" | "md" | "sm" }) {
  const sizeClasses = {
    lg: "text-5xl md:text-7xl",
    md: "text-4xl md:text-5xl",
    sm: "text-2xl md:text-3xl",
  };
  return (
    <div className="flex flex-col items-center">
      <span
        className={`${sizeClasses[size]} tracking-wider`}
        style={{
          fontFamily: DS.fontHeading,
          color: DS.primary,
          textShadow: `0 0 20px ${DS.glowPrimary}, 0 0 40px rgba(255,107,53,0.3)`,
        }}
      >
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[10px] tracking-[0.25em] mt-2 uppercase" style={{ fontFamily: DS.fontHeading, color: DS.textMuted }}>
        {label}
      </span>
    </div>
  );
}

export function CountdownSeparator({ size = "lg" }: { size?: "lg" | "md" | "sm" }) {
  const sizeClasses = { lg: "text-5xl md:text-7xl", md: "text-4xl md:text-5xl", sm: "text-2xl md:text-3xl" };
  return <span className={`${sizeClasses[size]} self-start`} style={{ fontFamily: DS.fontHeading, color: "rgba(255,107,53,0.35)" }}>:</span>;
}

export function CountdownRow({ target, size = "lg" }: { target: Date; size?: "lg" | "md" | "sm" }) {
  const cd = useCountdown(target);
  return (
    <div className="flex gap-6 md:gap-10">
      <CountdownBlock value={cd.days} label="Days" size={size} />
      <CountdownSeparator size={size} />
      <CountdownBlock value={cd.hours} label="Hours" size={size} />
      <CountdownSeparator size={size} />
      <CountdownBlock value={cd.minutes} label="Min" size={size} />
      <CountdownSeparator size={size} />
      <CountdownBlock value={cd.seconds} label="Sec" size={size} />
    </div>
  );
}

/** Compact inline countdown like "T-02d 14h 33m" */
export function CountdownInline({ target, className = "" }: { target: Date; className?: string }) {
  const cd = useCountdown(target);
  const text = cd.days > 0
    ? `T-${cd.days}d ${cd.hours}h ${cd.minutes}m`
    : `T-${cd.hours}h ${cd.minutes}m ${cd.seconds}s`;
  return (
    <span
      className={`text-xs tracking-wider ${className}`}
      style={{ fontFamily: DS.fontHeading, color: DS.primary, textShadow: `0 0 8px rgba(255,107,53,0.4)` }}
    >
      {text}
    </span>
  );
}

/* ─── Agency Badge ─── */
export function AgencyBadge({ agency, agencyShort, size = "sm" }: { agency: string; agencyShort: string; size?: "sm" | "md" }) {
  const color = AGENCY_COLORS[agency] || DS.secondary;
  const dim = size === "md" ? "w-7 h-7" : "w-5 h-5";
  const textSize = size === "md" ? "text-[10px]" : "text-[8px]";
  return (
    <div className="flex items-center gap-2">
      <div className={`${dim} rounded-full flex items-center justify-center shrink-0`} style={{ backgroundColor: `${color}22` }}>
        <span className={textSize} style={{ fontFamily: DS.fontHeading, color }}>{agencyShort.charAt(0)}</span>
      </div>
      <span className="text-xs" style={{ color: DS.textBody }}>{agency}</span>
    </div>
  );
}

/* ─── Orbit Tag ─── */
export function OrbitTag({ orbit }: { orbit: string }) {
  return (
    <span
      className="px-2 py-0.5 rounded text-[10px] tracking-widest border"
      style={{
        fontFamily: DS.fontHeading,
        background: `${DS.secondary}15`,
        color: DS.secondary,
        borderColor: `${DS.secondary}20`,
      }}
    >
      {orbit}
    </span>
  );
}

/* ─── Glass Card Surface ─── */
export function GlassCard({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border p-6 ${className}`}
      style={{ background: DS.cardGradient, borderColor: DS.border, backdropFilter: "blur(10px)" }}
    >
      {title && (
        <h3 className="text-xs tracking-[0.2em] mb-5" style={{ fontFamily: DS.fontHeading, color: DS.textHeading }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

/* ─── Quick Fact Item ─── */
export function QuickFact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0" style={{ color: DS.secondary }}>{icon}</div>
      <div>
        <p className="text-[10px] tracking-wider uppercase" style={{ fontFamily: DS.fontHeading, color: DS.textMuted }}>{label}</p>
        <p className="text-sm" style={{ color: DS.textHeading }}>{value}</p>
      </div>
    </div>
  );
}

/* ─── Filter Chip ─── */
export function FilterChip({ label, active, onClick, dot }: { label: string; active: boolean; onClick: () => void; dot?: string }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 px-3.5 py-1.5 rounded-full text-xs transition-all duration-300 border cursor-pointer"
      style={{
        fontFamily: DS.fontBody,
        background: active ? `${DS.secondary}15` : DS.glass,
        borderColor: active ? `${DS.secondary}80` : DS.border,
        color: active ? DS.secondary : DS.textBody,
        boxShadow: active ? `0 0 12px ${DS.glowSecondary}` : "none",
      }}
    >
      {dot && <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: dot }} />}
      {label}
    </button>
  );
}

/* ─── Search Bar ─── */
export function SearchBar({
  value, onChange, onFocus, onBlur, focused, placeholder = "Search missions, rockets, agencies...", onClear,
}: {
  value: string; onChange: (v: string) => void; onFocus: () => void; onBlur: () => void;
  focused: boolean; placeholder?: string; onClear: () => void;
}) {
  return (
    <div
      className="flex items-center gap-3 px-5 py-3.5 rounded-xl border transition-all duration-300"
      style={{
        background: DS.glassCard,
        backdropFilter: "blur(10px)",
        borderColor: focused ? `${DS.secondary}80` : DS.border,
        boxShadow: focused ? `0 0 20px ${DS.glowSecondary}` : "none",
      }}
    >
      <Search className="w-5 h-5 shrink-0" style={{ color: DS.textMuted }} />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none text-sm"
        style={{ color: DS.textHeading, fontFamily: DS.fontBody }}
      />
      {value && (
        <button onClick={onClear} className="transition-colors hover:opacity-80" style={{ color: DS.textMuted }}>
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

/* ─── Buttons ─── */
export function ButtonPrimary({ children, onClick, className = "" }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-2.5 rounded-full text-sm transition-all duration-300 border cursor-pointer ${className}`}
      style={{
        fontFamily: DS.fontHeading,
        fontSize: 11,
        letterSpacing: "0.1em",
        background: `${DS.primary}20`,
        borderColor: `${DS.primary}60`,
        color: DS.primary,
        textShadow: `0 0 8px ${DS.glowPrimary}`,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = `${DS.primary}35`; e.currentTarget.style.boxShadow = `0 0 20px ${DS.glowPrimary}`; }}
      onMouseLeave={e => { e.currentTarget.style.background = `${DS.primary}20`; e.currentTarget.style.boxShadow = "none"; }}
    >
      {children}
    </button>
  );
}

export function ButtonSecondary({ children, onClick, className = "" }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-2.5 rounded-full text-sm transition-all duration-300 border cursor-pointer ${className}`}
      style={{
        fontFamily: DS.fontHeading,
        fontSize: 11,
        letterSpacing: "0.1em",
        background: "transparent",
        borderColor: `${DS.secondary}40`,
        color: DS.secondary,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = `${DS.secondary}12`; e.currentTarget.style.boxShadow = `0 0 20px ${DS.glowSecondary}`; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.boxShadow = "none"; }}
    >
      {children}
    </button>
  );
}

export function ButtonGhost({ children, onClick, className = "" }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-xs transition-colors cursor-pointer ${className}`}
      style={{ color: DS.secondary, fontFamily: DS.fontBody }}
      onMouseEnter={e => { e.currentTarget.style.color = DS.textHeading; }}
      onMouseLeave={e => { e.currentTarget.style.color = DS.secondary; }}
    >
      {children}
    </button>
  );
}

/* ─── Launch Card Skeleton ─── */
export function LaunchCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden border" style={{ borderColor: DS.border, background: DS.cardGradient }}>
      <div className="h-40 lp-skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-3/4 rounded lp-skeleton" />
        <div className="h-3 w-1/2 rounded lp-skeleton" />
        <div className="h-3 w-2/3 rounded lp-skeleton" />
        <div className="pt-2 border-t" style={{ borderColor: DS.border }}>
          <div className="h-3 w-1/3 rounded lp-skeleton" />
        </div>
      </div>
    </div>
  );
}

/* ─── Empty State ─── */
export function EmptyState({ onReset }: { onReset?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div
        className="w-20 h-20 rounded-full border flex items-center justify-center mb-6"
        style={{ borderColor: DS.border, background: `${DS.surface}80` }}
      >
        <Telescope className="w-8 h-8" style={{ color: DS.textMuted }} />
      </div>
      <p className="text-lg mb-2" style={{ fontFamily: DS.fontHeading, color: DS.textHeading }}>No launches found</p>
      <p className="text-sm mb-6" style={{ color: DS.textMuted }}>Try adjusting your filters or search query</p>
      {onReset && <ButtonSecondary onClick={onReset}>Reset Filters</ButtonSecondary>}
    </div>
  );
}

/* ─── Live Badge ─── */
export function LiveBadge() {
  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full border" style={{ borderColor: `${DS.error}30`, background: `${DS.error}10` }}>
      <span className="w-2 h-2 rounded-full lp-live-dot" style={{ backgroundColor: DS.error }} />
      <span className="text-[10px] tracking-[0.3em]" style={{ fontFamily: DS.fontHeading, color: DS.error }}>LIVE</span>
    </div>
  );
}

/* ─── Section Label ─── */
export function SectionLabel({ children }: { children: string }) {
  return (
    <h2 className="tracking-[0.2em]" style={{ fontFamily: DS.fontHeading, fontSize: 14, color: DS.textHeading }}>
      {children}
    </h2>
  );
}

/* ─── Stat Pill ─── */
export function StatPill({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div
      className="flex items-center gap-3 px-5 py-3 rounded-full border"
      style={{ borderColor: DS.border, background: DS.glass, backdropFilter: "blur(10px)" }}
    >
      {icon}
      <span className="text-lg" style={{ fontFamily: DS.fontHeading, color: DS.textHeading }}>{value}</span>
      <span className="text-xs" style={{ color: DS.textMuted }}>{label}</span>
    </div>
  );
}

/* ─── Page Shell ─── */
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen relative" style={{ background: DS.pageGradient, fontFamily: DS.fontBody }}>
      {children}
    </div>
  );
}

/* ─── Navbar (Desktop + Mobile) ─── */
export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isExplore = location.pathname === "/explore";

  return (
    <nav className="sticky top-0 z-50 border-b" style={{ borderColor: DS.border, background: "rgba(10,10,15,0.85)", backdropFilter: "blur(20px)" }}>
      <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 no-underline group">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 32 32" fill="none">
            {/* Outer orbital ring */}
            <ellipse cx="16" cy="16" rx="14" ry="8" stroke={DS.primary} strokeWidth="1.5" opacity="0.7" transform="rotate(-25 16 16)" />
            {/* Inner orbital ring */}
            <ellipse cx="16" cy="16" rx="10" ry="5" stroke={DS.secondary} strokeWidth="1" opacity="0.4" transform="rotate(35 16 16)" />
            {/* Core star */}
            <circle cx="16" cy="16" r="3.5" fill={DS.primary} opacity="0.9" />
            <circle cx="16" cy="16" r="2" fill={DS.bg} />
            <circle cx="16" cy="16" r="1.2" fill={DS.primary} />
            {/* Orbital dots */}
            <circle cx="27" cy="11" r="1.5" fill={DS.secondary} opacity="0.8" />
            <circle cx="5" cy="21" r="1" fill={DS.primary} opacity="0.5" />
          </svg>
          <span className="text-lg tracking-[0.2em] group-hover:tracking-[0.25em] transition-all duration-500" style={{ fontFamily: DS.fontHeading, color: DS.textHeading }}>ORBIX</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <NavLink to="/" active={isHome}>HOME</NavLink>
          <NavLink to="/explore" active={isExplore}>EXPLORE</NavLink>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/explore"
            className="w-9 h-9 rounded-full border flex items-center justify-center transition-colors no-underline"
            style={{ borderColor: `${DS.textHeading}10` }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = `${DS.secondary}60`)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = `${DS.textHeading}10`)}
          >
            <Search className="w-4 h-4" style={{ color: DS.textMuted }} />
          </Link>
          {/* Mobile hamburger */}
          <button
            className="md:hidden w-9 h-9 rounded-full border flex items-center justify-center"
            style={{ borderColor: `${DS.textHeading}10` }}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-4 h-4" style={{ color: DS.textBody }} /> : <Menu className="w-4 h-4" style={{ color: DS.textBody }} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t px-6 py-4 space-y-3" style={{ borderColor: DS.border, background: "rgba(10,10,15,0.95)" }}>
          <Link to="/" className="block py-2 text-sm tracking-wider no-underline" style={{ fontFamily: DS.fontHeading, fontSize: 11, color: isHome ? DS.textHeading : DS.textMuted }} onClick={() => setMobileOpen(false)}>HOME</Link>
          <Link to="/explore" className="block py-2 text-sm tracking-wider no-underline" style={{ fontFamily: DS.fontHeading, fontSize: 11, color: isExplore ? DS.textHeading : DS.textMuted }} onClick={() => setMobileOpen(false)}>EXPLORE</Link>
        </div>
      )}
    </nav>
  );
}

function NavLink({ to, active, children }: { to: string; active: boolean; children: string }) {
  return (
    <Link
      to={to}
      className="text-sm tracking-wider transition-colors no-underline"
      style={{ fontFamily: DS.fontHeading, fontSize: 11, color: active ? DS.textHeading : DS.textMuted }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.color = DS.secondary; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.color = DS.textMuted; }}
    >
      {children}
    </Link>
  );
}

/* ─── Status dot color helper ─── */
export function statusDotColor(status: Status): string {
  return STATUS_DOT_COLORS[status];
}

/* ═══════════════════════════════════════════════════════ */
/* ─── API-Aware Components (Live Data) ─── */
/* ═══════════════════════════════════════════════════════ */

/** Status chip that accepts raw API status object */
export function APIStatusChip({ status }: { status: APIStatus }) {
  const config = getStatusConfig(status);
  const isInFlight = status.id === 6;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] tracking-widest border ${isInFlight ? "lp-pulse-blue" : ""}`}
      style={{
        fontFamily: DS.fontHeading,
        background: `${config.color}18`,
        color: config.color,
        borderColor: `${config.color}30`,
      }}
    >
      {isInFlight && <span className="w-1.5 h-1.5 rounded-full lp-live-dot" style={{ backgroundColor: config.color }} />}
      {config.label}
    </span>
  );
}

/** Agency badge that uses API logo URL */
export function APIAgencyBadge({ agency, size = "sm" }: { agency: { name: string; logo_url?: string | null }; size?: "sm" | "md" }) {
  const color = getAgencyColor(agency.name);
  const abbrev = getAgencyAbbrev(agency.name);
  const dim = size === "md" ? "w-7 h-7" : "w-5 h-5";
  const textSize = size === "md" ? "text-[10px]" : "text-[8px]";

  return (
    <div className="flex items-center gap-2">
      {agency.logo_url ? (
        <img
          src={agency.logo_url}
          alt={agency.name}
          className={`${dim} rounded-full object-cover shrink-0`}
          style={{ backgroundColor: `${color}22` }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      ) : (
        <div className={`${dim} rounded-full flex items-center justify-center shrink-0`} style={{ backgroundColor: `${color}22` }}>
          <span className={textSize} style={{ fontFamily: DS.fontHeading, color }}>{abbrev.charAt(0)}</span>
        </div>
      )}
      <span className="text-xs" style={{ color: DS.textBody }}>{agency.name}</span>
    </div>
  );
}

/** API status dot color */
export function apiStatusDotColor(status: APIStatus): string {
  return getStatusConfig(status).color;
}

/** Loading spinner */
export function LoadingState({ message = "Loading launch data..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="relative w-16 h-16 mb-6">
        <div
          className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: `${DS.secondary}40`, borderTopColor: DS.secondary }}
        />
        <div
          className="absolute inset-2 rounded-full border-2 border-b-transparent animate-spin"
          style={{ borderColor: `${DS.primary}30`, borderBottomColor: DS.primary, animationDirection: "reverse", animationDuration: "1.5s" }}
        />
      </div>
      <p className="text-sm" style={{ fontFamily: DS.fontHeading, color: DS.textMuted, letterSpacing: "0.1em" }}>{message}</p>
    </div>
  );
}

/** Error state with retry */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div
        className="w-20 h-20 rounded-full border flex items-center justify-center mb-6"
        style={{ borderColor: `${DS.error}30`, background: `${DS.error}08` }}
      >
        <span className="text-3xl">⚠</span>
      </div>
      <p className="text-lg mb-2" style={{ fontFamily: DS.fontHeading, color: DS.textHeading }}>Houston, we have a problem</p>
      <p className="text-sm mb-6 max-w-md" style={{ color: DS.textMuted }}>{message}</p>
      {onRetry && <ButtonSecondary onClick={onRetry}>Try Again</ButtonSecondary>}
    </div>
  );
}
