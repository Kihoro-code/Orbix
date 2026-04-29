import { useState, useMemo } from "react";
import { Link } from "react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DS, APIStatusChip, CountdownInline } from "./shared";
import { getMissionName, getRocketName } from "../../services/formatters";
import type { APILaunch } from "../../services/types";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isToday(year: number, month: number, day: number): boolean {
  const now = new Date();
  return now.getFullYear() === year && now.getMonth() === month && now.getDate() === day;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

interface LaunchGroup {
  date: Date;
  launches: APILaunch[];
}

function groupLaunchesByDate(launches: APILaunch[]): Map<string, LaunchGroup> {
  const map = new Map<string, LaunchGroup>();
  for (const launch of launches) {
    const d = new Date(launch.net);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const existing = map.get(key);
    if (existing) {
      existing.launches.push(launch);
    } else {
      map.set(key, { date: d, launches: [launch] });
    }
  }
  return map;
}

function DayCell({
  day,
  isCurrentMonth,
  launches,
  today,
  onClick,
}: {
  day: number | null;
  isCurrentMonth: boolean;
  launches: APILaunch[];
  today: boolean;
  onClick: () => void;
}) {
  const maxDots = 3;
  const overflow = launches.length - maxDots;

  return (
    <button
      onClick={day && launches.length > 0 ? onClick : undefined}
      className={`aspect-square rounded-lg border transition-all flex flex-col items-start p-1.5 gap-0.5 cursor-pointer ${
        day ? "" : "opacity-0 pointer-events-none"
      }`}
      style={{
        background: today ? `${DS.primary}12` : DS.glass,
        borderColor: today ? `${DS.primary}40` : isCurrentMonth ? DS.border : "transparent",
        color: DS.textHeading,
      }}
      onMouseEnter={(e) => {
        if (day && launches.length > 0) {
          e.currentTarget.style.borderColor = `${DS.secondary}60`;
          e.currentTarget.style.boxShadow = `0 0 10px ${DS.glowSecondary}`;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = today ? `${DS.primary}40` : isCurrentMonth ? DS.border : "transparent";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {day && (
        <>
          <span
            className="text-[11px] leading-none"
            style={{
              fontFamily: DS.fontHeading,
              color: today ? DS.primary : isCurrentMonth ? DS.textBody : DS.textMuted,
            }}
          >
            {day}
          </span>
          <div className="flex flex-col gap-0.5 mt-0.5 w-full overflow-hidden">
            {launches.slice(0, maxDots).map((l, i) => (
              <span
                key={i}
                className="text-[7px] leading-tight truncate w-full"
                style={{ color: DS.secondary }}
              >
                {getMissionName(l)}
              </span>
            ))}
            {overflow > 0 && (
              <span className="text-[7px]" style={{ color: DS.textMuted }}>
                +{overflow} more
              </span>
            )}
          </div>
        </>
      )}
    </button>
  );
}

function DatePopover({
  launches,
  onClose,
}: {
  launches: APILaunch[];
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      <div
        className="rounded-xl border p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto"
        style={{ background: DS.surface, borderColor: DS.border }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm tracking-wider mb-4" style={{ fontFamily: DS.fontHeading, color: DS.textHeading }}>
          {launches.length} LAUNCH{launches.length !== 1 ? "ES" : ""}
        </h3>
        <div className="space-y-3">
          {launches.map((l) => (
            <Link
              key={l.id}
              to={`/launch/${l.id}`}
              className="no-underline flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
              onClick={onClose}
            >
              <APIStatusChip status={l.status} />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate" style={{ color: DS.textHeading }}>
                  {getMissionName(l)}
                </p>
                <p className="text-[10px]" style={{ color: DS.textMuted }}>
                  {getRocketName(l)}
                </p>
              </div>
              <CountdownInline target={new Date(l.net)} className="text-[10px] shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CalendarGrid({ launches }: { launches: APILaunch[] }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthName = new Date(year, month).toLocaleString("en-US", { month: "long" });

  const grouped = useMemo(() => groupLaunchesByDate(launches), [launches]);

  const selectedLaunches = useMemo(() => {
    if (!selectedDate) return [];
    return launches.filter((l) => isSameDay(new Date(l.net), selectedDate));
  }, [launches, selectedDate]);

  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const cells: (number | null)[] = [];
  const prevMonthDays = getDaysInMonth(year, month === 0 ? 11 : month - 1);

  for (let i = 0; i < totalCells; i++) {
    if (i < firstDay) {
      cells.push(prevMonthDays - firstDay + i + 1);
    } else if (i >= firstDay + daysInMonth) {
      cells.push(i - firstDay - daysInMonth + 1);
    } else {
      cells.push(i - firstDay + 1);
    }
  }

  const goToPrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={goToPrevMonth}
            className="w-8 h-8 rounded-lg border flex items-center justify-center cursor-pointer transition-colors"
            style={{ borderColor: DS.border }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = DS.secondary; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = DS.border; }}
          >
            <ChevronLeft className="w-4 h-4" style={{ color: DS.textMuted }} />
          </button>
          <span className="text-lg tracking-wider" style={{ fontFamily: DS.fontHeading, color: DS.textHeading }}>
            {monthName} {year}
          </span>
          <button
            onClick={goToNextMonth}
            className="w-8 h-8 rounded-lg border flex items-center justify-center cursor-pointer transition-colors"
            style={{ borderColor: DS.border }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = DS.secondary; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = DS.border; }}
          >
            <ChevronRight className="w-4 h-4" style={{ color: DS.textMuted }} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS_OF_WEEK.map((d) => (
          <div key={d} className="text-center py-1">
            <span className="text-[9px] tracking-widest" style={{ fontFamily: DS.fontHeading, color: DS.textMuted }}>
              {d}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          const isCurrentMonth = i >= firstDay && i < firstDay + daysInMonth;
          const cellDate = day != null && isCurrentMonth ? new Date(year, month, day) : null;
          const cellLaunches = cellDate
            ? grouped.get(`${year}-${month}-${cellDate.getDate()}`)?.launches ?? []
            : [];
          const todayFlag = cellDate ? isToday(year, month, day!) : false;

          return (
            <DayCell
              key={i}
              day={day && isCurrentMonth ? day : null}
              isCurrentMonth={isCurrentMonth}
              launches={cellLaunches}
              today={todayFlag}
              onClick={() => cellDate && setSelectedDate(cellDate)}
            />
          );
        })}
      </div>

      {selectedDate && selectedLaunches.length > 0 && (
        <DatePopover
          launches={selectedLaunches}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}
