import { useState } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Clock, Calendar as CalendarIcon } from "lucide-react";
import {
  buildWhatsAppUrl,
  createBooking,
  formatHour,
  formatLongDate,
  type DayCell,
} from "@/lib/bookings";

const formSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name").max(120),
  phone: z
    .string()
    .trim()
    .min(4, "Please enter a valid phone number")
    .max(40)
    .regex(/^[+\d\s().-]+$/, "Phone can only contain digits and + - ( ) ."),
  email: z.string().trim().email("Please enter a valid email").max(255),
});

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selection: { day: DayCell; hour: number; slotUtc: Date } | null;
  onBooked: () => void;
};

export function BookingModal({ open, onOpenChange, selection, onBooked }: Props) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setFullName("");
    setPhone("");
    setEmail("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selection) return;

    const parsed = formSchema.safeParse({ fullName, phone, email });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your details");
      return;
    }

    setSubmitting(true);
    try {
      await createBooking({
        slotUtc: selection.slotUtc,
        fullName: parsed.data.fullName,
        phone: parsed.data.phone,
        email: parsed.data.email,
      });

      const url = buildWhatsAppUrl({
        fullName: parsed.data.fullName,
        phone: parsed.data.phone,
        email: parsed.data.email,
        dateLabel: formatLongDate(selection.day),
        timeLabel: formatHour(selection.hour),
      });

      window.open(url, "_blank", "noopener,noreferrer");
      toast.success("Booking confirmed. Opening WhatsApp…");
      reset();
      onOpenChange(false);
      onBooked();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not save booking";
      if (msg.toLowerCase().includes("duplicate") || msg.includes("unique")) {
        toast.error("That slot was just booked. Please pick another.");
        onOpenChange(false);
        onBooked();
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!submitting) onOpenChange(o); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            Confirm your consultation
          </DialogTitle>
          <DialogDescription>
            Fill in your details to reserve this slot with Gracious.
          </DialogDescription>
        </DialogHeader>

        {selection && (
          <div className="rounded-lg border border-[var(--gold-soft)] bg-[var(--gold-soft)]/40 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CalendarIcon className="h-4 w-4 text-[var(--gold)]" />
              <span className="font-medium">{formatLongDate(selection.day)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-[var(--gold)]" />
              <span className="font-medium">{formatHour(selection.hour)} WAT</span>
              <span className="ml-auto inline-flex items-center rounded-full bg-foreground px-2.5 py-0.5 text-xs font-medium text-background">
                30 minutes
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              maxLength={120}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              maxLength={40}
              placeholder="+234…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={255}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-[var(--gold)] text-[oklch(0.2_0.01_60)] hover:bg-[var(--gold)]/90"
            >
              {submitting ? "Confirming…" : "Confirm booking"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
