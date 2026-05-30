## Booking Calendar for Gracious Opara

A clean, light-theme, gold-accented 1-on-1 booking page. Slots persist in Lovable Cloud (Supabase) so bookings are shared across devices; on confirm we open a pre-filled WhatsApp message to +2348081345997.

### Page layout (single route `/`)
- Hero header
  - Circular framed portrait (uploaded image, gold ring border)
  - Name: **Gracious Opara** — High Ticket Sales Coach
  - Tagline: **"OG of Sales — You can build. But can't sell."**
  - CTA: "Book 1-on-1 Consultation" (scrolls to calendar)
  - LinkedIn + Email links
- Info strip: "All calls are 30 minutes • Times shown in WAT (UTC+1)"
- Calendar section
  - Next 4 weeks, Monday–Saturday only (no Sundays)
  - Week navigator (Week 1 / 2 / 3 / 4 tabs)
  - Day columns with hourly slots 10:00 AM → 9:00 PM
  - Available: white card, gold border on hover
  - Booked: greyed out, `disabled`, not clickable
  - Past slots also disabled
- Footer with contact info

### Booking modal
Opens on slot click. Shows:
- Selected date (e.g. "Tuesday, 3 June 2026")
- Time + "30 minutes" duration badge
- Form: Full Name, Phone Number, Email (all required, validated)
- Confirm button

On confirm:
1. Insert row into `bookings` table via Supabase
2. Mark slot booked locally (refetch)
3. Open `https://wa.me/2348081345997?text=...` in new tab with the exact message format specified
4. Show success toast

### Tech / data

```text
table: bookings
- id uuid pk default gen_random_uuid()
- slot_at timestamptz unique not null   -- the booked datetime in UTC
- full_name text not null
- phone text not null
- email text not null
- created_at timestamptz default now()
```

- RLS enabled. Policies:
  - `anon` + `authenticated`: `INSERT` allowed (public booking form)
  - `anon` + `authenticated`: `SELECT` of `slot_at` only via a view `public.booked_slots` (id, slot_at) so we never expose names/phones/emails publicly
  - Base table has `SELECT USING (false)` — admin/service role only for full reads
- Grants: `INSERT` on `bookings` to anon+authenticated; `SELECT` on `booked_slots` view to anon+authenticated
- Frontend queries `booked_slots` (just timestamps) to grey out slots
- Time handling: build slot datetimes in WAT (UTC+1) then convert to UTC ISO for storage; display always in WAT

### Files
- Enable Lovable Cloud, run migration for `bookings` + `booked_slots` view + RLS/grants
- `src/routes/index.tsx` — page (hero + calendar)
- `src/components/BookingCalendar.tsx` — 4-week grid, slot buttons
- `src/components/BookingModal.tsx` — form + confirm + WhatsApp redirect
- `src/lib/bookings.ts` — fetch booked slots, insert booking, WhatsApp URL builder
- `src/assets/gracious.jpg` — uploaded portrait
- `src/styles.css` — light theme with gold accent tokens (`--primary` = gold, neutral ivory background)

### Design
- Background: warm ivory (`oklch(0.985 0.005 85)`)
- Primary/accent: gold (`oklch(0.78 0.13 85)`)
- Foreground: deep charcoal
- Typography: serif display heading (Playfair/Cormorant) + clean sans body
- Subtle gold ring on portrait, gold underline on CTAs, restrained motion
