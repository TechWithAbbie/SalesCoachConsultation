import { createFileRoute } from "@tanstack/react-router";
import { memo, useState } from "react";
import { Linkedin, Mail, Clock, Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { BookingCalendar } from "@/components/BookingCalendar";
import graciousPortrait from "@/assets/gracious.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Book a 1-on-1 with Gracious Opara — High Ticket Sales Coach" },
      {
        name: "description",
        content:
          "Reserve a 30-minute consultation with Gracious Opara, the OG of Sales. Pick a time, confirm, and we'll lock it in.",
      },
      { property: "og:title", content: "Book a 1-on-1 with Gracious Opara" },
      {
        property: "og:description",
        content: "30-minute high-ticket sales consultations. Monday–Saturday, 10 AM to 9 PM WAT.",
      },
    ],
  }),
  component: Landing,
});

// ─── Stable calendar island ────────────────────────────────────────────────────
// Wrapping in memo means Landing's showBooking state flips NEVER cause
// BookingCalendar to re-render. The form fields are completely isolated.
const StableBookingCalendar = memo(BookingCalendar);

// ─── Booking section ───────────────────────────────────────────────────────────
// Extracted into its own memo'd component so it never re-renders due to
// anything happening in Landing (hero buttons, etc.)
const BookingSection = memo(function BookingSection() {
  return (
    <main id="booking-section" className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
      <div className="mb-8">
        <h2 className="font-display text-3xl sm:text-4xl">Pick a date</h2>
        <p className="mt-2 text-muted-foreground">
          Choose an available date and time. Once you confirm, you will be redirected to WhatsApp
          to share your booking with Gracious directly.
        </p>
      </div>
      <StableBookingCalendar />
    </main>
  );
});

// ─── Landing ───────────────────────────────────────────────────────────────────

function Landing() {
  const [showBooking, setShowBooking] = useState(false);

  function handleBookingToggle() {
    setShowBooking((v) => {
      if (!v) {
        // Scroll after state flip
        setTimeout(() => {
          document.getElementById("booking-section")?.scrollIntoView({ behavior: "smooth" });
        }, 50);
      }
      return !v;
    });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster richColors position="top-center" />

      {/* Hero */}
      <header className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, color-mix(in oklab, var(--gold) 18%, transparent) 0%, transparent 70%)",
          }}
        />
        <div className="mx-auto flex max-w-5xl flex-col items-center px-6 py-16 text-center sm:py-24">
          {/* Portrait */}
          <div className="relative mb-8">
            <div className="absolute -inset-2 rounded-full bg-linear-to-br from-gold via-gold-soft to-gold blur-md opacity-70" />
            <div className="relative h-40 w-40 overflow-hidden rounded-full ring-4 ring-gold ring-offset-4 ring-offset-background sm:h-48 sm:w-48">
              <img
                src={graciousPortrait}
                alt="Gracious Opara, High Ticket Sales Coach"
                className="h-full w-full object-cover"
                loading="eager"
              />
            </div>
          </div>

          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            High Ticket Sales Coach
          </p>
          <h1 className="font-display text-4xl leading-tight sm:text-6xl">Gracious Opara</h1>
          <p className="mt-3 font-display text-2xl italic text-muted-foreground sm:text-3xl">
            The OG of Sales
          </p>
          <p className="mt-6 max-w-xl text-base text-foreground/80 sm:text-lg">
            You can build. But can&rsquo;t sell.
            <br />
            <span className="text-muted-foreground">
              Book a 1-on-1 consultation and fix that — for good.
            </span>
          </p>

          <button
            type="button"
            onClick={handleBookingToggle}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3 text-sm font-medium text-background transition hover:bg-foreground/90"
          >
            <CalendarIcon className="h-4 w-4" />
            Book 1-on-1 Consultation
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-300 ${showBooking ? "rotate-180" : ""}`}
            />
          </button>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
            <a
              href="https://www.linkedin.com/in/gracious-opara-29081b222"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-muted-foreground transition hover:text-gold"
            >
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </a>
            <a
              href="mailto:geeopara@gmail.com"
              className="inline-flex items-center gap-2 text-muted-foreground transition hover:text-gold"
            >
              <Mail className="h-4 w-4" />
              geeopara@gmail.com
            </a>
          </div>
        </div>
      </header>

      {/* Info strip */}
      <section className="border-b border-border bg-gold-soft/30">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-6 py-5 text-sm text-foreground sm:flex-row sm:justify-center sm:gap-6">
          <span className="inline-flex items-center gap-2 font-medium">
            <Clock className="h-4 w-4 text-gold" />
            All calls are 30 minutes
          </span>
          <span className="hidden text-muted-foreground sm:inline">•</span>
          <span className="text-muted-foreground">
            Times shown in WAT (UTC+1) · Monday–Saturday · 10 AM – 9 PM
          </span>
        </div>
      </section>

      {/* Booking section — rendered once, never remounts due to memo */}
      {showBooking && <BookingSection />}

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Gracious Opara · High Ticket Sales Coach</p>
          <div className="flex items-center gap-4">
            <a
              href="https://www.linkedin.com/in/gracious-opara-29081b222"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gold"
            >
              LinkedIn
            </a>
            <a href="mailto:geeopara@gmail.com" className="hover:text-gold">
              Email
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}