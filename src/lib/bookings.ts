import { supabase } from "@/integrations/supabase/client";

export const BOSS_PHONE = "2348081345997"; // wa.me format (no +)
export const WAT_OFFSET_HOURS = 1; // West Africa Time (UTC+1, no DST)

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DAY_NAMES_LONG = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];
export const MONTH_NAMES_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Hours 10..21 (10 AM to 9 PM)
export const HOURS = Array.from({ length: 12 }, (_, i) => 10 + i);

/** Build a Date that represents the given WAT wall-clock moment, in UTC. */
export function watToUtc(year: number, month: number, day: number, hour: number): Date {
  // WAT = UTC+1, so UTC hour = WAT hour - 1
  return new Date(Date.UTC(year, month, day, hour - WAT_OFFSET_HOURS, 0, 0));
}

/** Format a WAT hour (10..21) as "10:00 AM" / "1:00 PM" etc. */
export function formatHour(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}:00 ${period}`;
}

export type DayCell = {
  /** WAT-local date components */
  year: number;
  month: number; // 0-11
  day: number;
  dayOfWeek: number; // 0-6, Sunday = 0
};

/** Get the Monday-start of the WAT-local week containing `today`. */
function startOfWatWeek(now: Date): DayCell {
  // Convert "now" to WAT wall-clock
  const wat = new Date(now.getTime() + WAT_OFFSET_HOURS * 3600_000);
  const y = wat.getUTCFullYear();
  const m = wat.getUTCMonth();
  const d = wat.getUTCDate();
  const dow = wat.getUTCDay(); // 0=Sun..6=Sat
  // Days back to Monday (treat Monday as week start)
  const back = dow === 0 ? 6 : dow - 1;
  const monday = new Date(Date.UTC(y, m, d - back));
  return {
    year: monday.getUTCFullYear(),
    month: monday.getUTCMonth(),
    day: monday.getUTCDate(),
    dayOfWeek: 1,
  };
}

/** Returns 4 weeks × 6 weekdays (Mon-Sat) starting this week (WAT). */
export function buildWeeks(now: Date = new Date()): DayCell[][] {
  const start = startOfWatWeek(now);
  const weeks: DayCell[][] = [];
  for (let w = 0; w < 4; w++) {
    const week: DayCell[] = [];
    for (let i = 0; i < 6; i++) {
      // Mon..Sat = +0..+5
      const offset = w * 7 + i;
      const d = new Date(Date.UTC(start.year, start.month, start.day + offset));
      week.push({
        year: d.getUTCFullYear(),
        month: d.getUTCMonth(),
        day: d.getUTCDate(),
        dayOfWeek: d.getUTCDay(),
      });
    }
    weeks.push(week);
  }
  return weeks;
}

export function formatLongDate(cell: DayCell): string {
  return `${DAY_NAMES_LONG[cell.dayOfWeek]}, ${cell.day} ${MONTH_NAMES_LONG[cell.month]} ${cell.year}`;
}

export function formatShortDate(cell: DayCell): string {
  return `${DAY_NAMES[cell.dayOfWeek]} ${cell.day} ${MONTH_NAMES_LONG[cell.month].slice(0, 3)}`;
}

export async function fetchBookedSlots(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("booked_slots" as never)
    .select("slot_at");
  if (error) throw error;
  const set = new Set<string>();
  for (const row of (data ?? []) as Array<{ slot_at: string }>) {
    set.add(new Date(row.slot_at).toISOString());
  }
  return set;
}

export async function createBooking(input: {
  slotUtc: Date;
  fullName: string;
  phone: string;
  email: string;
}) {
  const { error } = await supabase.from("bookings" as never).insert({
    slot_at: input.slotUtc.toISOString(),
    full_name: input.fullName.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
  } as never);
  if (error) throw error;
}

export function buildWhatsAppUrl(input: {
  fullName: string;
  phone: string;
  email: string;
  dateLabel: string;
  timeLabel: string;
}): string {
  const message =
    `New Meeting Booking 📅\n\n` +
    `Name: ${input.fullName}\n` +
    `Phone: ${input.phone}\n` +
    `Email: ${input.email}\n` +
    `Date: ${input.dateLabel}\n` +
    `Time: ${input.timeLabel} WAT\n` +
    `Duration: 30 minutes`;
  return `https://wa.me/${BOSS_PHONE}?text=${encodeURIComponent(message)}`;
}
