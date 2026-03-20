import { useState } from "react";
import { StudentNavbar } from "@/components/StudentNavbar";
import { PostponeModal } from "@/components/PostponeModal";
import { Button } from "@/components/ui/button";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { myBookings as initialBookings, slots as initialSlots, type Booking, type Slot } from "@/data/mockData";
import { toast } from "sonner";
import { X, ArrowRightLeft, Clock, CalendarCheck } from "lucide-react";

export default function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [allSlots, setAllSlots] = useState<Slot[]>(initialSlots);
  const [postponeId, setPostponeId] = useState<string | null>(null);

  // ── handleCancel ──
  const handleCancel = (bookingId: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    setAllSlots((prev) =>
      prev.map((s) => (s.id === booking.slotId ? { ...s, status: "available" as const } : s))
    );

    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    toast.success(`Booking cancelled successfully.`);
  };

  // ── handlePostpone ──
  const handlePostpone = (bookingId: string, newSlotId: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    const newSlot = allSlots.find((s) => s.id === newSlotId);
    if (!booking || !newSlot) return;

    setAllSlots((prev) =>
      prev.map((s) => {
        if (s.id === booking.slotId) return { ...s, status: "available" as const };
        if (s.id === newSlotId) return { ...s, status: "booked" as const };
        return s;
      })
    );

    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? { ...b, slotId: newSlotId, time: newSlot.time, date: newSlot.date, status: "Confirmed" as const }
          : b
      )
    );

    toast.success(`Booking postponed to ${newSlot.time}!`);
    setPostponeId(null);
  };

  const postponeBooking = bookings.find((b) => b.id === postponeId);
  const availableSlotsForPostpone = postponeBooking
    ? allSlots.filter((s) => s.sportId === postponeBooking.sportId && s.status === "available")
    : [];

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "Confirmed":
        return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400";
      case "Cancelled":
        return "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400";
      case "Postponed":
        return "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen">
      <StudentNavbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-12">
        <div className="mb-8 flex items-center gap-3 animate-fade-up">
          <CalendarCheck className="h-8 w-8 text-emerald-500" />
          <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl tracking-tight">My Bookings</h1>
          <span className="ml-2 inline-flex items-center justify-center h-8 min-w-8 px-2 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-sm font-bold">
            {bookings.length}
          </span>
        </div>

        {bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-fade-up">
            <CalendarCheck className="h-12 w-12 mb-4 opacity-30" />
            <p className="text-lg">No bookings yet.</p>
          </div>
        ) : (
          <>
            {/* Desktop table with GlowingEffect wrapper */}
            <div className="hidden md:block animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <div className="relative rounded-[1.25rem] border-[0.75px] border-border p-2 md:rounded-[1.5rem] md:p-3">
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                  borderWidth={3}
                />
                <div className="relative overflow-hidden rounded-xl border-[0.75px] bg-background shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="px-6 py-4 text-left font-bold text-xs uppercase tracking-wider text-muted-foreground">Sport</th>
                        <th className="px-6 py-4 text-left font-bold text-xs uppercase tracking-wider text-muted-foreground">Date</th>
                        <th className="px-6 py-4 text-left font-bold text-xs uppercase tracking-wider text-muted-foreground">Time</th>
                        <th className="px-6 py-4 text-left font-bold text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                        <th className="px-6 py-4 text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => (
                        <tr key={b.id} className="border-b last:border-0 hover:bg-accent/10 transition-colors duration-200">
                          <td className="px-6 py-5 font-semibold text-foreground">{b.sport}</td>
                          <td className="px-6 py-5 text-muted-foreground">{b.date}</td>
                          <td className="px-6 py-5">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <Clock className="h-3.5 w-3.5" /> {b.time}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold transition-all duration-300 ${getStatusStyles(b.status)}`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-right space-x-2">
                            {b.status === "Confirmed" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-xl border-red-200 dark:border-red-800/40 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 hover:border-red-300 transition-all duration-200 hover:shadow-md hover:shadow-red-500/10"
                                  onClick={() => handleCancel(b.id)}
                                >
                                  <X className="h-3.5 w-3.5 mr-1" /> Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-all duration-200 hover:shadow-md hover:shadow-amber-500/20 hover:-translate-y-0.5"
                                  onClick={() => setPostponeId(b.id)}
                                >
                                  <ArrowRightLeft className="h-3.5 w-3.5 mr-1" /> Postpone
                                </Button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Mobile cards with GlowingEffect */}
            <ul className="md:hidden space-y-4">
              {bookings.map((b, i) => (
                <li key={b.id} className="list-none">
                  <div
                    className="relative rounded-[1.25rem] border-[0.75px] border-border p-2 md:rounded-[1.5rem] md:p-3 animate-pop-in"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <GlowingEffect
                      spread={40}
                      glow={true}
                      disabled={false}
                      proximity={64}
                      inactiveZone={0.01}
                      borderWidth={3}
                    />
                    <div className="relative overflow-hidden rounded-xl border-[0.75px] bg-background p-5 space-y-3 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)]">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">{b.sport}</span>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusStyles(b.status)}`}>
                          {b.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {b.date} · {b.time}
                      </div>
                      {b.status === "Confirmed" && (
                        <div className="flex gap-2 pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 rounded-xl border-red-200 dark:border-red-800/40 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 transition-all duration-200"
                            onClick={() => handleCancel(b.id)}
                          >
                            <X className="h-3.5 w-3.5 mr-1" /> Cancel
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-all duration-200 hover:shadow-md hover:shadow-amber-500/20"
                            onClick={() => setPostponeId(b.id)}
                          >
                            <ArrowRightLeft className="h-3.5 w-3.5 mr-1" /> Postpone
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>

      <PostponeModal
        open={!!postponeId}
        onClose={() => setPostponeId(null)}
        bookingId={postponeId || ""}
        availableSlots={availableSlotsForPostpone}
        onConfirm={(newSlotId) => {
          if (postponeId) handlePostpone(postponeId, newSlotId);
        }}
      />
    </div>
  );
}
