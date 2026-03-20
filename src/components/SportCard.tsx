import { useNavigate } from "react-router-dom";
import type { Sport } from "@/data/mockData";
import { ArrowRight } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";

interface SportCardProps {
  sport: Sport;
  index?: number;
}

export function SportCard({ sport, index = 0 }: SportCardProps) {
  const navigate = useNavigate();

  return (
    <li className="list-none min-h-[14rem]">
      <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-border p-2 md:rounded-[1.5rem] md:p-3">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={3}
        />
        <button
          onClick={() => navigate(`/booking/${sport.id}`)}
          className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-xl border-[0.75px] bg-background p-7 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)] animate-fade-up"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative flex flex-col gap-5">
            <div className="text-5xl transition-transform duration-300 hover:scale-110 inline-block">{sport.icon}</div>
            <div className="space-y-1.5">
              <h3 className="text-xl leading-[1.375rem] font-semibold font-sans tracking-[-0.04em] md:text-2xl md:leading-[1.875rem] text-foreground">{sport.name}</h3>
              <p className="font-sans text-sm leading-[1.125rem] md:text-base md:leading-[1.375rem] text-muted-foreground">{sport.description}</p>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary">
                {sport.availableSlots} slots available
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </div>
        </button>
      </div>
    </li>
  );
}
