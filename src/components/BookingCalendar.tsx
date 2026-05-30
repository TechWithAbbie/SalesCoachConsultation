import { useMemo, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  fetchBookedSlots,
  formatHour,
  formatLongDate,
  HOURS,
  MONTH_NAMES_LONG,
  watToUtc,
  WAT_OFFSET_HOURS,
  type DayCell,
} from "@/lib/bookings";
import { BookingModal } from "./BookingModal";
import { cn } from "@/lib/utils";

type Selection = { day: DayCell; hour: number; slotUtc: Date };

// Get today's WAT-local date components
function todayWat(): { year: number; month: number; day: number } {
  const wat = new Date(Date.now() + WAT_OFFSET_HOURS * 3600_000);
  return {
    year: wat.getUTCFullYear(),
    month: wat.getUTCMonth(),
    day: wat.getUTCDate(),
  };
}

function buildMonthGrid(year: number, month: number): (DayCell | null)[] {
  // Monday-first grid
  const firstDow = new Date(Date.UTC(year, month, 1)).getUTCDay(); // 0=Sun
  const leading = firstDow === 0 ? 6 : firstDow - 1;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (DayCell | null)[] = [];
  for (let i = 0; i < leading; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(Date.UTC(year, month, d));
    cells.push({
      year,
      month,
      day: d,
      dayOfWeek: date.getUTCDay(),
    });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function BookingCalendar() {
  const today = useMemo(todayWat, []);
  const [view, setView] = useState({ year: today.year, month: today.month });
  const [selectedDay, setSelectedDay] = useState<DayCell | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [open, setOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const now = useMemo(() => new Date(), []);
  const cells = useMemo(() => buildMonthGrid(view.year, view.month), [view]);

  const { data: booked, refetch, isLoading } = useQuery({
    queryKey: ["booked-slots"],
    queryFn: fetchBookedSlots,
    refetchOnWindowFocus: true,
  });

  // Bound: can't go before current month
  const canGoPrev =
    view.year > today.year ||
    (view.year === today.year && view.month > today.month);

  function shiftMonth(delta: number) {
    if (delta < 0 && !canGoPrev) return;
    const d = new Date(Date.UTC(view.year, view.month + delta, 1));
    setView({ year: d.getUTCFullYear(), month: d.getUTCMonth() });
    setSelectedDay(null);
  }

  function isDayDisabled(cell: DayCell): boolean {
    // No Sundays
    if (cell.dayOfWeek === 0) return true;
    // Past days
    if (cell.year < today.year) return true;
    if (cell.year === today.year && cell.month < today.month) return true;
    if (
      cell.year === today.year &&
      cell.month === today.month &&
      cell.day < today.day
    )
      return true;
    return false;
  }

  function isSameDay(a: DayCell, b: DayCell): boolean {
    return a.year === b.year && a.month === b.month && a.day === b.day;
  }

  function handlePickTime(hour: number) {
    if (!selectedDay) return;
    const slotUtc = watToUtc(
      selectedDay.year,
      selectedDay.month,
      selectedDay.day,
      hour,
    );
    setSelection({ day: selectedDay, hour, slotUtc });
    setOpen(true);
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 50) return;
    if (dx < 0) shiftMonth(1); // swipe left → next month
    else shiftMonth(-1); // swipe right → previous month
  }

  return (
    <div className="space-y-6">
      {/* Month header with nav */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          disabled={!canGoPrev}
          aria-label="Previous month"
          className={cn(
            "rounded-full border border-border bg-card p-2 transition",
            canGoPrev
              ? "hover:border-[var(--gold)] hover:text-[var(--gold)]"
              : "cursor-not-allowed opacity-40",
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="font-display text-xl sm:text-2xl">
          {MONTH_NAMES_LONG[view.month]} {view.year}
        </div>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          aria-label="Next month"
          className="rounded-full border border-border bg-card p-2 transition hover:border-[var(--gold)] hover:text-[var(--gold)]"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Month grid */}
      <div
        className="rounded-2xl border border-border bg-card p-3 sm:p-5 shadow-sm select-none"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-xs font-medium text-muted-foreground">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {cells.map((cell, i) => {
            if (!cell) return <div key={i} className="aspect-square" />;
            const disabled = isDayDisabled(cell);
            const selected = selectedDay && isSameDay(cell, selectedDay);
            return (
              <button
                key={i}
                type="button"
                disabled={disabled}
                onClick={() => setSelectedDay(cell)}
                className={cn(
                  "aspect-square rounded-lg text-sm font-medium transition flex items-center justify-center",
                  disabled
                    ? "cursor-not-allowed text-muted-foreground/40"
                    : selected
                      ? "bg-[var(--gold)] text-[oklch(0.2_0.01_60)] shadow-sm"
                      : "bg-background text-foreground hover:border hover:border-[var(--gold)] hover:bg-[var(--gold-soft)]/40 border border-transparent",
                )}
              >
                {cell.day}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground sm:hidden">
          Swipe to change month
        </p>
      </div>

      {/* Time slots once a day is selected */}
      {selectedDay && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Select a time
            </div>
            <div className="font-display text-lg">
              {formatLongDate(selectedDay)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {HOURS.map((hour) => {
              const slotUtc = watToUtc(
                selectedDay.year,
                selectedDay.month,
                selectedDay.day,
                hour,
              );
              const isPast = slotUtc.getTime() <= now.getTime();
              const isBooked = booked?.has(slotUtc.toISOString()) ?? false;
              const disabled = isPast || isBooked || isLoading;
              return (
                <button
                  key={hour}
                  type="button"
                  disabled={disabled}
                  onClick={() => handlePickTime(hour)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm font-medium transition",
                    disabled
                      ? "cursor-not-allowed border-border bg-muted text-muted-foreground/60 line-through"
                      : "border-border bg-background text-foreground hover:border-[var(--gold)] hover:bg-[var(--gold-soft)]/50",
                  )}
                >
                  {formatHour(hour)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <BookingModal
        open={open}
        onOpenChange={setOpen}
        selection={selection}
        onBooked={() => refetch()}
      />
    </div>
  );
}
