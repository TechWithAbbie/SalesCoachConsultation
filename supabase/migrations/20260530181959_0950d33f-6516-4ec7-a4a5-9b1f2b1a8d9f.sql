
DROP POLICY "Anyone can insert bookings" ON public.bookings;

CREATE POLICY "Anyone can insert valid bookings"
  ON public.bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(btrim(full_name)) BETWEEN 1 AND 120
    AND length(btrim(phone)) BETWEEN 4 AND 40
    AND length(btrim(email)) BETWEEN 3 AND 255
    AND email LIKE '%_@_%.__%'
    AND slot_at > now() - interval '5 minutes'
  );
