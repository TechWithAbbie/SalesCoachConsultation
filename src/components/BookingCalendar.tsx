import { useMemo, useState, useRef, useCallback, useEffect, memo } from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { toast } from "sonner";
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
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayWat() {
  const wat = new Date(Date.now() + WAT_OFFSET_HOURS * 3600_000);
  return { year: wat.getUTCFullYear(), month: wat.getUTCMonth(), day: wat.getUTCDate() };
}

function buildMonthGrid(year: number, month: number): (DayCell | null)[] {
  const firstDow = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const leading = firstDow === 0 ? 6 : firstDow - 1;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (DayCell | null)[] = [];
  for (let i = 0; i < leading; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ year, month, day: d, dayOfWeek: new Date(Date.UTC(year, month, d)).getUTCDay() });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function getInitialView(today: { year: number; month: number; day: number }) {
  const daysInMonth = new Date(Date.UTC(today.year, today.month + 1, 0)).getUTCDate();
  for (let d = today.day; d <= daysInMonth; d++) {
    const dow = new Date(Date.UTC(today.year, today.month, d)).getUTCDay();
    if (dow !== 0) return { year: today.year, month: today.month };
  }
  const next = new Date(Date.UTC(today.year, today.month + 1, 1));
  return { year: next.getUTCFullYear(), month: next.getUTCMonth() };
}

// ─── Booking Form ─────────────────────────────────────────────────────────────
// Completely uncontrolled (refs only). memo + stable onConfirm ref means this
// component NEVER re-renders due to parent state changes while the user types.

interface BookingFormProps {
  selectedDay: DayCell;
  selectedHour: number;
  // Using a ref-backed stable function — reference never changes between renders
  onConfirm: (fields: {
    fullName: string;
    phone: string;
    email: string;
    topic: string;
  }) => Promise<void>;
  onChangeTime: () => void;
}

const BookingForm = memo(
  function BookingForm({ selectedDay, selectedHour, onConfirm, onChangeTime }: BookingFormProps) {
    const nameRef = useRef<HTMLInputElement>(null);
    const phoneRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const topicRef = useRef<HTMLInputElement>(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit() {
      const fullName = nameRef.current?.value.trim() ?? "";
      const phone = phoneRef.current?.value.trim() ?? "";
      const email = emailRef.current?.value.trim() ?? "";
      const topic = topicRef.current?.value.trim() ?? "";

      if (!fullName || !phone || !email || !topic) {
        toast.error("Please fill in all fields.");
        return;
      }

      setSubmitting(true);
      try {
        await onConfirm({ fullName, phone, email, topic });
      } finally {
        setSubmitting(false);
      }
    }

    const cls =
      "w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold transition";

    return (
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            Step 3 — Your details
          </p>
          <p className="font-display text-lg mt-0.5">
            {formatLongDate(selectedDay)} at {formatHour(selectedHour)} WAT
          </p>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Full Name</label>
            <input
              ref={nameRef}
              type="text"
              placeholder="Your full name"
              maxLength={120}
              className={cls}
              autoComplete="name"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Phone Number</label>
            <input
              ref={phoneRef}
              type="tel"
              placeholder="+234…"
              maxLength={40}
              autoComplete="tel"
              className={cls}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Email Address</label>
            <input
              ref={emailRef}
              type="email"
              placeholder="you@example.com"
              maxLength={255}
              autoComplete="email"
              className={cls}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              What do you want to discuss?
            </label>
            <input
              ref={topicRef}
              type="text"
              placeholder="e.g. Closing high ticket clients, objection handling…"
              maxLength={200}
              className={cls}
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full rounded-xl bg-gold py-3 text-sm font-semibold text-foreground transition hover:bg-gold/90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Confirming…" : "Confirm Booking & Open WhatsApp"}
          </button>

          <button
            type="button"
            onClick={onChangeTime}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition"
          >
            ← Change time
          </button>
        </div>
      </div>
    );
  },
  // Custom comparator: NEVER re-render BookingForm once mounted.
  // onConfirm is ref-backed so it's always current; selectedDay/Hour only
  // change when the user picks a new slot, at which point the key prop
  // on BookingForm forces a clean remount anyway.
  () => true,
);

// ─── Main Calendar ────────────────────────────────────────────────────────────

export function BookingCalendar() {
  const today = useMemo(todayWat, []);
  const [view, setView] = useState(() => getInitialView(today));
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayCell | null>(null);
  const [timeOpen, setTimeOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const [booked, setBooked] = useState<Set<string>>(new Set());
  const [slotsLoading, setSlotsLoading] = useState(false);

  const loadSlots = useCallback(async () => {
    setSlotsLoading(true);
    try {
      const result = await fetchBookedSlots();
      setBooked(result);
    } catch {
      // non-fatal
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const now = useMemo(() => new Date(), []);
  const cells = useMemo(() => buildMonthGrid(view.year, view.month), [view]);
  const touchStartX = useRef<number | null>(null);

  // ── Stable confirm ref ────────────────────────────────────────────────────────
  // This is the core fix. Instead of passing handleConfirm directly (which
  // changes reference every render because it closes over selectedDay/selectedHour),
  // we store the latest version in a ref and pass a STABLE wrapper that never
  // changes. BookingForm's memo comparator sees the same function reference
  // every render → no re-render → no form hang.
  const selectedDayRef = useRef(selectedDay);
  const selectedHourRef = useRef(selectedHour);
  const loadSlotsRef = useRef(loadSlots);

  useEffect(() => { selectedDayRef.current = selectedDay; }, [selectedDay]);
  useEffect(() => { selectedHourRef.current = selectedHour; }, [selectedHour]);
  useEffect(() => { loadSlotsRef.current = loadSlots; }, [loadSlots]);

  const stableConfirm = useRef(async (fields: {
    fullName: string;
    phone: string;
    email: string;
    topic: string;
  }) => {
    const day = selectedDayRef.current;
    const hour = selectedHourRef.current;
    if (!day || hour === null) return;

    const slotUtc = watToUtc(day.year, day.month, day.day, hour);

    const message =
      `New Booking Request 📅\n\n` +
      `Name: ${fields.fullName}\n` +
      `Phone: ${fields.phone}\n` +
      `Email: ${fields.email}\n` +
      `Topic: ${fields.topic}\n` +
      `Date: ${formatLongDate(day)}\n` +
      `Time: ${formatHour(hour)} WAT\n` +
      `Duration: 30 minutes`;

    const encoded = encodeURIComponent(message);
const deepLink = `whatsapp://send?phone=2348081345997&text=${encoded}`;
const webLink = `https://wa.me/2348081345997?text=${encoded}`;

const a = document.createElement("a");
a.href = deepLink;
a.click();

setTimeout(() => {
  window.open(webLink, "_blank", "noopener,noreferrer");
}, 1500);

    try {
      const { createBooking } = await import("@/lib/bookings");
      await createBooking({
        slotUtc,
        fullName: fields.fullName,
        phone: fields.phone,
        email: fields.email,
      });

      toast.success("Booking confirmed. Opening WhatsApp…");
      setSelectedDay(null);
      setSelectedHour(null);
      setFormOpen(false);
      setCalendarOpen(false);
      loadSlotsRef.current();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not save booking";
      if (msg.toLowerCase().includes("duplicate") || msg.includes("unique")) {
        toast.error("That slot was just booked. Please pick another time.");
        setSelectedHour(null);
        setFormOpen(false);
        setTimeOpen(true);
        loadSlotsRef.current();
      } else {
        toast.error(msg);
      }
      throw err;
    }
  }).current;

  const stableChangeTime = useRef(() => {
    setFormOpen(false);
    setTimeOpen(true);
  }).current;

  // ── Day helpers ──────────────────────────────────────────────────────────────

  function isDayDisabled(cell: DayCell): boolean {
    if (cell.dayOfWeek === 0) return true;
    if (cell.year < today.year) return true;
    if (cell.year === today.year && cell.month < today.month) return true;
    if (cell.year === today.year && cell.month === today.month && cell.day < today.day) return true;
    return false;
  }

  function isSameDay(a: DayCell, b: DayCell) {
    return a.year === b.year && a.month === b.month && a.day === b.day;
  }

  const canGoPrev =
    view.year > today.year || (view.year === today.year && view.month > today.month);

  // ── Month navigation ─────────────────────────────────────────────────────────

  function shiftMonth(delta: number) {
    if (delta < 0 && !canGoPrev) return;
    const d = new Date(Date.UTC(view.year, view.month + delta, 1));
    setView({ year: d.getUTCFullYear(), month: d.getUTCMonth() });
    setSelectedDay(null);
    setSelectedHour(null);
    setFormOpen(false);
  }

  // ── Step handlers ────────────────────────────────────────────────────────────

  function handleSelectDay(cell: DayCell) {
    setSelectedDay(cell);
    setSelectedHour(null);
    setFormOpen(false);
    setCalendarOpen(false);
    setTimeOpen(true);
  }

  function handleProceedToForm() {
    if (selectedHour === null) {
      toast.error("Please select a time first.");
      return;
    }
    setFormOpen(true);
    setTimeOpen(false);
  }

  // ── Touch swipe ──────────────────────────────────────────────────────────────

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 50) return;
    dx < 0 ? shiftMonth(1) : shiftMonth(-1);
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Step 1: Date */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setCalendarOpen((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-left transition hover:bg-gold-soft/20"
        >
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Step 1 — Date
            </p>
            <p className="font-display text-lg mt-0.5">
              {selectedDay ? formatLongDate(selectedDay) : "Select a date"}
            </p>
          </div>
          <ChevronDown
            className={cn(
              "h-5 w-5 text-muted-foreground transition-transform duration-300",
              calendarOpen && "rotate-180",
            )}
          />
        </button>

        {calendarOpen && (
          <div
            className="border-t border-border p-3 sm:p-5 select-none"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                disabled={!canGoPrev}
                aria-label="Previous month"
                className={cn(
                  "rounded-full border border-border bg-background p-2 transition",
                  canGoPrev ? "hover:border-gold hover:text-gold" : "cursor-not-allowed opacity-40",
                )}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="font-display text-lg">
                {MONTH_NAMES_LONG[view.month]} {view.year}
              </div>

              <button
                type="button"
                onClick={() => shiftMonth(1)}
                aria-label="Next month"
                className="rounded-full border border-border bg-background p-2 transition hover:border-gold hover:text-gold"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-xs font-medium text-muted-foreground">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {cells.map((cell, i) => {
                if (!cell || isDayDisabled(cell)) return <div key={i} className="aspect-square" />;
                const selected = selectedDay && isSameDay(cell, selectedDay);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectDay(cell)}
                    className={cn(
                      "aspect-square rounded-lg text-sm font-medium transition flex items-center justify-center border",
                      selected
                        ? "bg-gold text-foreground shadow-sm border-gold"
                        : "bg-background text-foreground border-transparent hover:border-gold hover:bg-gold-soft/40",
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
        )}
      </div>

      {/* Step 2: Time */}
      {selectedDay && (
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => {
              setTimeOpen((v) => !v);
              setFormOpen(false);
            }}
            className="w-full flex items-center justify-between px-5 py-4 text-left transition hover:bg-gold-soft/20"
          >
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                Step 2 — Time
              </p>
              <p className="font-display text-lg mt-0.5">
                {selectedHour !== null ? `${formatHour(selectedHour)} WAT` : "Select a time"}
              </p>
            </div>
            <ChevronDown
              className={cn(
                "h-5 w-5 text-muted-foreground transition-transform duration-300",
                timeOpen && "rotate-180",
              )}
            />
          </button>

          {timeOpen && (
            <div className="border-t border-border p-5 space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {HOURS.map((hour) => {
                  const slotUtc = watToUtc(
                    selectedDay.year,
                    selectedDay.month,
                    selectedDay.day,
                    hour,
                  );
                  const isPast = slotUtc.getTime() <= now.getTime();
                  const isBooked = booked.has(slotUtc.toISOString());
                  const disabled = isPast || isBooked || slotsLoading;
                  const isSelected = selectedHour === hour;

                  return (
                    <button
                      key={hour}
                      type="button"
                      disabled={disabled}
                      onClick={() => setSelectedHour(hour)}
                      className={cn(
                        "rounded-md border px-3 py-2 text-sm font-medium transition",
                        disabled
                          ? "cursor-not-allowed border-border bg-muted text-muted-foreground/60 line-through"
                          : isSelected
                            ? "border-gold bg-gold text-foreground"
                            : "border-border bg-background text-foreground hover:border-gold hover:bg-gold-soft/50",
                      )}
                    >
                      {formatHour(hour)}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleProceedToForm}
                disabled={selectedHour === null}
                className={cn(
                  "w-full rounded-xl py-3 text-sm font-semibold transition",
                  selectedHour !== null
                    ? "bg-foreground text-background hover:bg-foreground/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed",
                )}
              >
                Continue to your details →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Form — never re-renders once mounted */}
      {formOpen && selectedDay && selectedHour !== null && (
        <BookingForm
          key={`${selectedDay.year}-${selectedDay.month}-${selectedDay.day}-${selectedHour}`}
          selectedDay={selectedDay}
          selectedHour={selectedHour}
          onConfirm={stableConfirm}
          onChangeTime={stableChangeTime}
        />
      )}
    </div>
  );
}