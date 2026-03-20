import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { StudentNavbar } from "@/components/StudentNavbar";
import { PostponeModal } from "@/components/PostponeModal";
import { Button } from "@/components/ui/button";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { slots as initialSlots, sports, type Slot, type Booking } from "@/data/mockData";
import { ArrowLeft, Clock, CalendarCheck, X, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";

let bookingCounter = 0;

export default function Booking() {
  const { sportId } = useParams();
  const navigate = useNavigate();
  const sport = sports.find((s) => s.id === sportId);

  // ── Core state ──
  const [allSlots, setAllSlots] = useState<Slot[]>(initialSlots);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [postponeBookingId, setPostponeBookingId] = useState<string | null>(null);

  const sportSlots = allSlots.filter((s) => s.sportId === sportId);

  // ── handleBook ──
  const handleBook = (slotId: string) => {
    const slot = allSlots.find((s) => s.id === slotId);
    if (!slot || slot.status === "booked") return;

    setAllSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, status: "booked" as const } : s))
    );

    bookingCounter++;
    const newBooking: Booking = {
      id: `session-b${bookingCounter}`,
      slotId: slot.id,
      sportId: slot.sportId,
      sport: sport?.name || "",
      date: slot.date,
      time: slot.time,
      status: "Confirmed",
    };
    setBookings((prev) => [...prev, newBooking]);
    toast.success(`Booked ${sport?.name} at ${slot.time}!`);
  };

  // ── handleCancel ──
  const handleCancel = (bookingId: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    setAllSlots((prev) =>
      prev.map((s) => (s.id === booking.slotId ? { ...s, status: "available" as const } : s))
    );

    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    toast.success(`Booking cancelled. Slot is now available.`);
  };

  // ── handlePostpone ──
  const handlePostpone = (oldBookingId: string, newSlotId: string) => {
    const booking = bookings.find((b) => b.id === oldBookingId);
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
        b.id === oldBookingId
          ? { ...b, slotId: newSlotId, time: newSlot.time, date: newSlot.date, status: "Confirmed" as const }
          : b
      )
    );

    toast.success(`Booking postponed to ${newSlot.time}!`);
    setPostponeBookingId(null);
  };

  if (!sport) {
    return (
      <div className="min-h-screen">
        <StudentNavbar />
        <div className="flex items-center justify-center py-20 text-muted-foreground">Sport not found.</div>
      </div>
    );
  }

  const availableSlotsForPostpone = allSlots.filter(
    (s) => s.sportId === sportId && s.status === "available"
  );

  return (
    <div className="min-h-screen">
      <StudentNavbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-12">
        <button onClick={() => navigate("/dashboard")} className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all duration-200 group animate-fade-up">
          <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" /> Back to Dashboard
        </button>

        <div className="mb-10 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl tracking-tight">
            {sport.icon} {sport.name}
          </h1>
          <p className="mt-2 text-muted-foreground text-base">Select an available slot to book.</p>
        </div>

        {/* ── Slot Grid ── */}
        <ul className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {sportSlots.map((slot, i) => {
            const isAvailable = slot.status === "available";
            return (
              <li key={slot.id} className="list-none min-h-[10rem] animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-border p-2 md:rounded-[1.5rem] md:p-3">
                  <GlowingEffect
                    spread={40}
                    glow={true}
                    disabled={false}
                    proximity={64}
                    inactiveZone={0.01}
                    borderWidth={3}
                  />
                  <div
                    className={`relative flex h-full flex-col justify-between overflow-hidden rounded-xl border-[0.75px] p-6 shadow-sm transition-all duration-300 dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)] ${
                      isAvailable
                        ? "bg-background hover:-translate-y-1"
                        : "bg-red-50/50 dark:bg-red-950/20 opacity-75"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className={`h-4 w-4 ${isAvailable ? "text-emerald-500" : "text-red-400"}`} />
                      <span className="text-base font-bold text-foreground">{slot.time}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mb-3">{slot.date}</div>
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold mb-4 transition-all duration-300 ${
                      isAvailable
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                        : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                    }`}>
                      {isAvailable ? "✓ Available" : "✕ Booked"}
                    </span>
                    <div>
                      <Button
                        size="sm"
                        disabled={!isAvailable}
                        className={`w-full rounded-xl transition-all duration-300 ${
                          isAvailable
                            ? "bg-emerald-500 hover:bg-emerald-600 text-white hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5 active:translate-y-0"
                            : "bg-red-200/60 dark:bg-red-900/40 text-red-400 dark:text-red-500 cursor-not-allowed border-red-200 dark:border-red-800/30"
                        }`}
                        onClick={() => handleBook(slot.id)}
                      >
                        {isAvailable ? (
                          <span className="flex items-center gap-1.5">
                            <CalendarCheck className="h-3.5 w-3.5" /> Book Now
                          </span>
                        ) : (
                          "Booked"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {/* ── Session Bookings ── */}
        {bookings.length > 0 && (
          <div className="mt-14 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-2xl font-extrabold text-foreground mb-6 flex items-center gap-2.5">
              <CalendarCheck className="h-6 w-6 text-emerald-500" />
              My Session Bookings
              <span className="ml-2 inline-flex items-center justify-center h-7 w-7 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                {bookings.length}
              </span>
            </h2>

            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {bookings.map((booking, i) => (
                <li key={booking.id} className="list-none min-h-[10rem]">
                  <div
                    className="relative h-full rounded-[1.25rem] border-[0.75px] border-border p-2 md:rounded-[1.5rem] md:p-3 animate-pop-in"
                    style={{ animationDelay: `${i * 0.08}s` }}
                  >
                    <GlowingEffect
                      spread={40}
                      glow={true}
                      disabled={false}
                      proximity={64}
                      inactiveZone={0.01}
                      borderWidth={3}
                    />
                    <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-xl border-[0.75px] bg-background p-5 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)]">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-emerald-500" />
                          <span className="font-bold text-foreground">{booking.time}</span>
                        </div>
                        <span className="inline-block rounded-full px-3 py-1 text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                          {booking.status}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground mb-4">{booking.date}</div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 rounded-xl border-red-200 dark:border-red-800/40 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 hover:border-red-300 transition-all duration-200 hover:shadow-md hover:shadow-red-500/10"
                          onClick={() => handleCancel(booking.id)}
                        >
                          <X className="h-3.5 w-3.5 mr-1" /> Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-all duration-200 hover:shadow-md hover:shadow-amber-500/20 hover:-translate-y-0.5"
                          onClick={() => setPostponeBookingId(booking.id)}
                        >
                          <ArrowRightLeft className="h-3.5 w-3.5 mr-1" /> Postpone
                        </Button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>

      <PostponeModal
        open={!!postponeBookingId}
        onClose={() => setPostponeBookingId(null)}
        bookingId={postponeBookingId || ""}
        availableSlots={availableSlotsForPostpone}
        onConfirm={(newSlotId) => {
          if (postponeBookingId) handlePostpone(postponeBookingId, newSlotId);
        }}
      />
    </div>
  );
}
