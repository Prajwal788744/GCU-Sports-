export interface Sport {
  id: string;
  name: string;
  icon: string;
  description: string;
  availableSlots: number;
}

export interface Slot {
  id: string;
  sportId: string;
  time: string;
  status: "available" | "booked";
  date: string;
}

export interface Booking {
  id: string;
  slotId: string;
  sportId: string;
  sport: string;
  date: string;
  time: string;
  status: "Confirmed" | "Cancelled" | "Postponed";
}

export const sports: Sport[] = [
  { id: "cricket", name: "Cricket Turf", icon: "🏏", description: "Professional cricket turf with floodlights", availableSlots: 5 },
  { id: "futsal", name: "Futsal", icon: "⚽", description: "Indoor futsal court with synthetic turf", availableSlots: 3 },
  { id: "badminton", name: "Badminton", icon: "🏸", description: "Indoor badminton courts with wooden flooring", availableSlots: 7 },
];

export const slots: Slot[] = [
  { id: "s1", sportId: "cricket", time: "6 AM – 7 AM", status: "available", date: "2026-03-11" },
  { id: "s2", sportId: "cricket", time: "7 AM – 8 AM", status: "booked", date: "2026-03-11" },
  { id: "s3", sportId: "cricket", time: "8 AM – 9 AM", status: "available", date: "2026-03-11" },
  { id: "s4", sportId: "cricket", time: "4 PM – 5 PM", status: "available", date: "2026-03-11" },
  { id: "s5", sportId: "cricket", time: "5 PM – 6 PM", status: "booked", date: "2026-03-11" },
  { id: "s6", sportId: "cricket", time: "6 PM – 7 PM", status: "available", date: "2026-03-11" },
  { id: "s7", sportId: "futsal", time: "6 AM – 7 AM", status: "booked", date: "2026-03-11" },
  { id: "s8", sportId: "futsal", time: "7 AM – 8 AM", status: "available", date: "2026-03-11" },
  { id: "s9", sportId: "futsal", time: "5 PM – 6 PM", status: "available", date: "2026-03-11" },
  { id: "s10", sportId: "futsal", time: "6 PM – 7 PM", status: "booked", date: "2026-03-11" },
  { id: "s11", sportId: "badminton", time: "6 AM – 7 AM", status: "available", date: "2026-03-11" },
  { id: "s12", sportId: "badminton", time: "7 AM – 8 AM", status: "available", date: "2026-03-11" },
  { id: "s13", sportId: "badminton", time: "8 AM – 9 AM", status: "booked", date: "2026-03-11" },
  { id: "s14", sportId: "badminton", time: "4 PM – 5 PM", status: "available", date: "2026-03-11" },
  { id: "s15", sportId: "badminton", time: "5 PM – 6 PM", status: "available", date: "2026-03-11" },
  { id: "s16", sportId: "badminton", time: "6 PM – 7 PM", status: "available", date: "2026-03-11" },
  { id: "s17", sportId: "badminton", time: "7 PM – 8 PM", status: "booked", date: "2026-03-11" },
];

export const myBookings: Booking[] = [
  { id: "b1", slotId: "s2", sportId: "cricket", sport: "Cricket Turf", date: "2026-03-11", time: "7 AM – 8 AM", status: "Confirmed" },
  { id: "b2", slotId: "s15", sportId: "badminton", sport: "Badminton", date: "2026-03-12", time: "5 PM – 6 PM", status: "Confirmed" },
  { id: "b3", slotId: "s10", sportId: "futsal", sport: "Futsal", date: "2026-03-10", time: "6 PM – 7 PM", status: "Cancelled" },
];

export const adminStats = {
  totalBookings: 148,
  activeUsers: 67,
  mostPopularSport: "Badminton",
  peakTime: "5 PM – 6 PM",
};
