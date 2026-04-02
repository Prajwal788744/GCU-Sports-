import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, CalendarDays, Gamepad2, User } from "lucide-react";
import { useMemo } from "react";

const tabs = [
  { id: "home", icon: LayoutDashboard, label: "Home", path: "/dashboard" },
  { id: "bookings", icon: CalendarDays, label: "Bookings", path: "/my-bookings" },
  { id: "matches", icon: Gamepad2, label: "Matches", path: "/matches" },
  { id: "profile", icon: User, label: "Profile", path: "/profile" },
];

/**
 * Fixed bottom navigation bar for mobile devices.
 * Hides on desktop (md+). Appears on pages where a user is logged in.
 * Respects safe-area-inset-bottom for notched devices.
 */
export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();

  const publicPaths = ["/", "/login", "/signup"];
  const isPublic = publicPaths.includes(location.pathname);
  const isAdmin = location.pathname.startsWith("/admin");
  const isLive = location.pathname.startsWith("/live/");

  const activeIndex = useMemo(() => {
    const path = location.pathname;
    if (path === "/dashboard" || path.startsWith("/booking/")) return 0;
    if (
      path === "/my-bookings" ||
      path.startsWith("/match-lobby/") ||
      path.startsWith("/match-setup/") ||
      path.startsWith("/booking-team/") ||
      path.startsWith("/opponent-team-setup/")
    )
      return 1;
    if (path === "/matches") return 2;
    if (path === "/profile") return 3;
    return 0;
  }, [location.pathname]);

  if (!session || isPublic || isAdmin || isLive) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[9990] md:hidden border-t border-white/10 bg-[#0c0c0c]/95 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab, i) => {
          const isActive = activeIndex === i;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
                isActive ? "text-emerald-400" : "text-white/40 active:text-white/60"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]" : ""}`} />
              <span className={`text-[10px] font-semibold tracking-wide ${isActive ? "text-emerald-400" : "text-white/35"}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute top-0 h-[2px] w-10 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
