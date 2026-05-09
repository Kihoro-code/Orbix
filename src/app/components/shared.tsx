import { useState, useEffect, useCallback, type ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { Search, Menu, X, Telescope, RotateCw, LayoutGrid, Shield, CalendarDays, GitCompare, Star, Home, Radio } from "lucide-react";
import type { Status } from "./launchData";
import { STATUS_LABELS, STATUS_DOT_COLORS, AGENCY_COLORS } from "./launchData";
import type { APIStatus, APIAgency, APILaunch } from "../../services/types";
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

/* ─── Tab Bar ─── */
export function TabBar<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: T; label: string }[];
  active: T;
  onChange: (key: T) => void;
}) {
  return (
    <div
      className="flex gap-1 p-1 rounded-xl border w-fit max-w-full overflow-x-auto"
      style={{ borderColor: DS.border, background: DS.glass, scrollbarWidth: "none" }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className="px-4 py-2 rounded-lg text-xs tracking-wider transition-all duration-300 cursor-pointer"
          style={{
            fontFamily: DS.fontHeading,
            background: active === tab.key ? `${DS.secondary}20` : "transparent",
            color: active === tab.key ? DS.secondary : DS.textMuted,
            border: active === tab.key ? `1px solid ${DS.secondary}40` : "1px solid transparent",
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/* ─── View Toggle (Cards | Patches | Calendar) ─── */
export type ViewMode = "cards" | "patches" | "calendar";

export function ViewToggle({
  mode,
  onChange,
}: {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  const modes: { key: ViewMode; label: string; icon: ReactNode }[] = [
    { key: "cards", label: "Cards", icon: <LayoutGrid className="w-3 h-3" /> },
    { key: "patches", label: "Patches", icon: <Shield className="w-3 h-3" /> },
    { key: "calendar", label: "Calendar", icon: <CalendarDays className="w-3 h-3" /> },
  ];

  return (
    <div className="flex gap-1 p-1 rounded-lg border" style={{ borderColor: DS.border, background: DS.glass }}>
      {modes.map((m) => (
        <button
          key={m.key}
          onClick={() => onChange(m.key)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] tracking-wider transition-all cursor-pointer"
          style={{
            fontFamily: DS.fontHeading,
            background: mode === m.key ? `${DS.primary}15` : "transparent",
            color: mode === m.key ? DS.primary : DS.textMuted,
          }}
        >
          {m.icon}
          {m.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Date Preset Bar (for past launches) ─── */
const DATE_PRESETS = [
  { key: "30d", label: "30 Days", days: 30 },
  { key: "6m", label: "6 Months", days: 180 },
  { key: "12m", label: "12 Months", days: 365 },
];

export interface DatePreset {
  key: string;
  dateFrom: string;
  dateTo: string;
}

export function getDatePreset(key: string): DatePreset | null {
  const preset = DATE_PRESETS.find((p) => p.key === key);
  if (!preset) return null;
  const now = new Date();
  const from = new Date(now.getTime() - preset.days * 86400000);
  return {
    key: preset.key,
    dateFrom: from.toISOString().split("T")[0],
    dateTo: now.toISOString().split("T")[0],
  };
}

export function DatePresetBar({
  active,
  onChange,
}: {
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex gap-2">
      {DATE_PRESETS.map((preset) => (
        <button
          key={preset.key}
          onClick={() => onChange(preset.key)}
          className="px-3 py-1.5 rounded-full text-[10px] tracking-wider border transition-all cursor-pointer"
          style={{
            fontFamily: DS.fontHeading,
            background: active === preset.key ? `${DS.secondary}15` : "transparent",
            borderColor: active === preset.key ? `${DS.secondary}40` : DS.border,
            color: active === preset.key ? DS.secondary : DS.textMuted,
          }}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Favorite Star ─── */
export function FavoriteStar({
  favorited,
  onClick,
  size = "sm",
}: {
  favorited: boolean;
  onClick: () => void;
  size?: "sm" | "md";
}) {
  const dim = size === "md" ? "w-8 h-8" : "w-7 h-7";
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      className={`${dim} rounded-full border flex items-center justify-center cursor-pointer transition-all`}
      style={{
        background: favorited ? `${DS.primary}20` : `${DS.glass}90`,
        borderColor: favorited ? `${DS.primary}60` : DS.border,
        boxShadow: favorited ? `0 0 12px ${DS.glowPrimary}` : "none",
        backdropFilter: "blur(4px)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = favorited ? DS.primary : DS.secondary;
        e.currentTarget.style.boxShadow = favorited ? `0 0 16px ${DS.glowPrimary}` : `0 0 12px ${DS.glowSecondary}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = favorited ? `${DS.primary}60` : DS.border;
        e.currentTarget.style.boxShadow = favorited ? `0 0 12px ${DS.glowPrimary}` : "none";
      }}
    >
      <Star className="w-3.5 h-3.5" style={{ color: favorited ? DS.primary : DS.textMuted, fill: favorited ? DS.primary : "none" }} />
    </button>
  );
}

/* ─── Compare Dock ─── */
export function CompareDock({
  selected,
  onCompare,
  onRemove,
  maxCount,
}: {
  selected: APILaunch[];
  onCompare: () => void;
  onRemove: (id: string) => void;
  maxCount: number;
}) {
  if (selected.length === 0) return null;

  return (
    <div
      className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 rounded-2xl border shadow-2xl"
      style={{
        background: `${DS.surface}F0`,
        borderColor: `${DS.secondary}30`,
        backdropFilter: "blur(20px)",
        boxShadow: `0 0 40px ${DS.glowSecondary}`,
      }}
    >
      <div className="flex items-center gap-3">
        {selected.map((l) => (
          <div key={l.id} className="flex items-center gap-2 rounded-lg border px-3 py-1.5"
            style={{ borderColor: DS.border, background: DS.cardGradient }}>
            <span className="text-xs truncate max-w-32" style={{ color: DS.textHeading }}>
              {l.mission?.name ?? l.name.split("|").pop()?.trim() ?? l.name}
            </span>
            <button
              onClick={() => onRemove(l.id)}
              className="w-5 h-5 rounded-full flex items-center justify-center cursor-pointer transition-colors"
              style={{ background: `${DS.error}20`, color: DS.error }}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={onCompare}
        disabled={selected.length < 2}
        className="px-4 py-2 rounded-full text-xs tracking-wider transition-all border cursor-pointer flex items-center gap-2"
        style={{
          fontFamily: DS.fontHeading,
          background: selected.length >= 2 ? `${DS.primary}20` : DS.glass,
          borderColor: selected.length >= 2 ? `${DS.primary}60` : DS.border,
          color: selected.length >= 2 ? DS.primary : DS.textMuted,
          opacity: selected.length >= 2 ? 1 : 0.5,
        }}
      >
        <GitCompare className="w-3.5 h-3.5" />
        COMPARE ({selected.length}/{maxCount})
      </button>
    </div>
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
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isExplore = location.pathname === "/explore";
  const isLive = location.pathname === "/live";

  return (
    <div className="min-h-screen relative" style={{ background: DS.pageGradient, fontFamily: DS.fontBody }}>
      <div className="pb-16 md:pb-0" style={{ paddingBottom: "calc(64px + env(safe-area-inset-bottom, 0px))" }}>
        {children}
      </div>
      {/* Bottom tab bar — mobile only */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t flex items-center justify-around"
        style={{
          borderColor: DS.border,
          background: "rgba(10,10,15,0.95)",
          backdropFilter: "blur(20px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          height: 56,
        }}
      >
        <MobileTab to="/" icon={Home} label="Home" active={isHome} />
        <MobileTab to="/explore" icon={Search} label="Explore" active={isExplore} />
        <MobileTab to="/live" icon={Radio} label="Live" active={isLive} />
      </nav>
    </div>
  );
}

function MobileTab({ to, icon: Icon, label, active }: { to: string; icon: typeof Home; label: string; active: boolean }) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center justify-center gap-0.5 no-underline min-w-[64px]"
    >
      <Icon
        className="w-5 h-5 transition-colors"
        style={{ color: active ? DS.primary : DS.textMuted }}
      />
      <span
        className="text-[10px] tracking-wider transition-colors"
        style={{ fontFamily: DS.fontHeading, color: active ? DS.primary : DS.textMuted }}
      >
        {label}
      </span>
    </Link>
  );
}

/* ─── Navbar (Desktop + Mobile) ─── */
export function Navbar() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isExplore = location.pathname === "/explore";
  const isLive = location.pathname === "/live";

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
          <NavLink to="/live" active={isLive}>LIVE</NavLink>
        </div>

        {/* Search + mobile nav spacer */}
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
        </div>
      </div>
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

/** Refresh button — triggers client-side data re-fetch */
export function RefreshButton({ onClick, refreshing }: { onClick: () => void; refreshing?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={refreshing}
      className="px-4 py-2 rounded-full text-xs transition-all duration-300 border cursor-pointer flex items-center gap-2"
      style={{
        fontFamily: DS.fontHeading,
        letterSpacing: "0.1em",
        background: "transparent",
        borderColor: `${DS.secondary}40`,
        color: DS.secondary,
        opacity: refreshing ? 0.6 : 1,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = `${DS.secondary}12`; e.currentTarget.style.boxShadow = `0 0 20px ${DS.glowSecondary}`; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <RotateCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
      {refreshing ? "REFRESHING" : "REFRESH"}
    </button>
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
