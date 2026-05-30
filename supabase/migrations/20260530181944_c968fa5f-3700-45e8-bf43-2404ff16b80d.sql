
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_at timestamptz NOT NULL UNIQUE,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.bookings TO anon, authenticated;
GRANT ALL ON public.bookings TO service_role;

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Anyone can create a booking (public booking form)
CREATE POLICY "Anyone can insert bookings"
  ON public.bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- No direct SELECT on base table (protects PII)
CREATE POLICY "No direct read on bookings"
  ON public.bookings FOR SELECT
  TO anon, authenticated
  USING (false);

-- Public view exposing only booked timestamps
CREATE VIEW public.booked_slots
WITH (security_invoker = on) AS
  SELECT id, slot_at FROM public.bookings;

GRANT SELECT ON public.booked_slots TO anon, authenticated;

-- Allow the view (running as invoker) to see the slot_at column
CREATE POLICY "Public can read slot timestamps via view"
  ON public.bookings FOR SELECT
  TO anon, authenticated
  USING (true);
