import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  buildWeeks,
  fetchBookedSlots,
  formatHour,
  formatShortDate,
  HOURS,
  watToUtc,
  type DayCell,
} from "@/lib/bookings";
import { BookingModal } from "./BookingModal";
import { cn } from "@/lib/utils";

type Selection = { day: DayCell; hour: number; slotUtc: Date };

export function BookingCalendar() {
  const [weekIdx, setWeekIdx] = useState(0);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [open, setOpen] = useState(false);

  const weeks = useMemo(() => buildWeeks(new Date()), []);
  const now = useMemo(() => new Date(), []);

  const { data: booked, refetch, isLoading } = useQuery({
    queryKey: ["booked-slots"],
    queryFn: fetchBookedSlots,
    refetchOnWindowFocus: true,
  });

  function handlePick(day: DayCell, hour: number) {
    const slotUtc = watToUtc(day.year, day.month, day.day, hour);
    setSelection({ day, hour, slotUtc });
    setOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Week tabs */}
      <div className="flex flex-wrap gap-2">
        {weeks.map((w, i) => {
          const first = w[0];
          const last = w[w.length - 1];
          return (
            <button
              key={i}
              type="button"
              onClick={() => setWeekIdx(i)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm transition",
                weekIdx === i
                  ? "border-[var(--gold)] bg-[var(--gold)] text-[oklch(0.2_0.01_60)] font-medium"
                  : "border-border bg-card text-muted-foreground hover:border-[var(--gold)]",
              )}
            >
              Week {i + 1} · {first.day} {formatShortDate(first).split(" ")[2]} – {last.day} {formatShortDate(last).split(" ")[2]}
            </button>
          );
        })}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {weeks[weekIdx].map((day) => (
          <div
            key={`${day.year}-${day.month}-${day.day}`}
            className="rounded-2xl border border-border bg-card p-4 shadow-sm"
          >
            <div className="mb-3 border-b border-border pb-2">
              <div className="font-display text-lg leading-tight">
                {formatShortDate(day)}
              </div>
              <div className="text-xs text-muted-foreground">
                {day.year}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {HOURS.map((hour) => {
                const slotUtc = watToUtc(day.year, day.month, day.day, hour);
                const isPast = slotUtc.getTime() <= now.getTime();
                const isBooked = booked?.has(slotUtc.toISOString()) ?? false;
                const disabled = isPast || isBooked || isLoading;
                return (
                  <button
                    key={hour}
                    type="button"
                    disabled={disabled}
                    onClick={() => handlePick(day, hour)}
                    aria-label={`Book ${formatHour(hour)} on ${formatShortDate(day)}`}
                    className={cn(
                      "rounded-md border px-2 py-1.5 text-xs font-medium transition",
                      disabled
                        ? "cursor-not-allowed border-border bg-muted text-muted-foreground/60 line-through"
                        : "border-border bg-background text-foreground hover:border-[var(--gold)] hover:bg-[var(--gold-soft)]/50 hover:text-foreground",
                    )}
                  >
                    {formatHour(hour)}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded border border-border bg-background" />
          Available
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded border border-border bg-muted" />
          Booked / unavailable
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded border border-[var(--gold)] bg-[var(--gold-soft)]" />
          Hover to select
        </span>
      </div>

      <BookingModal
        open={open}
        onOpenChange={setOpen}
        selection={selection}
        onBooked={() => refetch()}
      />
    </div>
  );
}
