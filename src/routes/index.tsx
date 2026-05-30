import { createFileRoute } from "@tanstack/react-router";
import { Linkedin, Mail, Clock, Calendar as CalendarIcon } from "lucide-react";
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
        content:
          "30-minute high-ticket sales consultations. Monday–Saturday, 10 AM to 9 PM WAT.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
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
          {/* Portrait in circle frame with gold ring */}
          <div className="relative mb-8">
            <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-[var(--gold)] via-[var(--gold-soft)] to-[var(--gold)] blur-md opacity-70" />
            <div className="relative h-40 w-40 overflow-hidden rounded-full ring-4 ring-[var(--gold)] ring-offset-4 ring-offset-background sm:h-48 sm:w-48">
              <img
                src={graciousPortrait}
                alt="Gracious Opara, High Ticket Sales Coach"
                className="h-full w-full object-cover"
                loading="eager"
              />
            </div>
          </div>

          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gold)]">
            High Ticket Sales Coach
          </p>
          <h1 className="font-display text-4xl leading-tight sm:text-6xl">
            Gracious Opara
          </h1>
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

          <a
            href="#calendar"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3 text-sm font-medium text-background transition hover:bg-foreground/90"
          >
            <CalendarIcon className="h-4 w-4" />
            Book 1-on-1 Consultation
          </a>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
            <a
              href="https://www.linkedin.com/in/gracious-opara-29081b222"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-muted-foreground transition hover:text-[var(--gold)]"
            >
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </a>
            <a
              href="mailto:geeopara@gmail.com"
              className="inline-flex items-center gap-2 text-muted-foreground transition hover:text-[var(--gold)]"
            >
              <Mail className="h-4 w-4" />
              geeopara@gmail.com
            </a>
          </div>
        </div>
      </header>

      {/* Info strip */}
      <section className="border-b border-border bg-[var(--gold-soft)]/30">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-6 py-5 text-sm text-foreground sm:flex-row sm:justify-center sm:gap-6">
          <span className="inline-flex items-center gap-2 font-medium">
            <Clock className="h-4 w-4 text-[var(--gold)]" />
            All calls are 30 minutes
          </span>
          <span className="hidden text-muted-foreground sm:inline">•</span>
          <span className="text-muted-foreground">
            Times shown in WAT (UTC+1) · Monday–Saturday · 10 AM – 9 PM
          </span>
        </div>
      </section>

      {/* Calendar */}
      <main id="calendar" className="mx-auto max-w-7xl px-6 py-12 sm:py-16">
        <div className="mb-8 max-w-2xl">
          <h2 className="font-display text-3xl sm:text-4xl">Pick a time</h2>
          <p className="mt-2 text-muted-foreground">
            Choose any available slot in the next four weeks. Booked slots are
            greyed out. Once you confirm, you&rsquo;ll be redirected to WhatsApp
            to share your booking with Gracious directly.
          </p>
        </div>

        <BookingCalendar />
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Gracious Opara · High Ticket Sales Coach</p>
          <div className="flex items-center gap-4">
            <a
              href="https://www.linkedin.com/in/gracious-opara-29081b222"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--gold)]"
            >
              LinkedIn
            </a>
            <a href="mailto:geeopara@gmail.com" className="hover:text-[var(--gold)]">
              Email
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
