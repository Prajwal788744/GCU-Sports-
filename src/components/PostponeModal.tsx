import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Slot } from "@/data/mockData";
import { useState } from "react";
import { Clock, ArrowRightLeft } from "lucide-react";

interface PostponeModalProps {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  availableSlots?: Slot[];
  onConfirm?: (newSlotId: string) => void;
}

export function PostponeModal({ open, onClose, bookingId, availableSlots, onConfirm }: PostponeModalProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const slotsToShow = availableSlots || [];

  const handleConfirm = () => {
    if (!selected) return;
    if (onConfirm) {
      onConfirm(selected);
    }
    setSelected(null);
    onClose();
  };

  const handleClose = () => {
    setSelected(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-amber-500" />
            Postpone Booking
          </DialogTitle>
          <DialogDescription>Select a new available slot for your booking.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto py-2">
          {slotsToShow.length === 0 ? (
            <div className="col-span-2 text-center py-8 text-muted-foreground">
              No available slots to postpone to.
            </div>
          ) : (
            slotsToShow.map((slot, i) => (
              <button
                key={slot.id}
                onClick={() => setSelected(slot.id)}
                className={`rounded-xl border p-3 text-left text-sm transition-all duration-200 animate-slide-up-sm ${
                  selected === slot.id
                    ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30 ring-2 ring-amber-400/30 shadow-md shadow-amber-500/10"
                    : "border-border hover:border-amber-300 hover:bg-amber-50/50 dark:hover:bg-amber-950/10"
                }`}
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <div className="flex items-center gap-1.5">
                  <Clock className={`h-3.5 w-3.5 ${selected === slot.id ? "text-amber-500" : "text-muted-foreground"}`} />
                  <span className="font-semibold text-foreground">{slot.time}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{slot.date}</div>
              </button>
            ))
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={handleClose} className="rounded-xl">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selected}
            className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-all duration-200 hover:shadow-md hover:shadow-amber-500/20"
          >
            <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" />
            Confirm Postpone
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
