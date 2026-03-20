import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, CalendarDays, Settings2, Trophy, BarChart3, LogOut, Menu, X, Users, TrendingUp, Moon, Sun } from "lucide-react";
import { adminStats } from "@/data/mockData";
import { GlowingEffect } from "@/components/ui/glowing-effect";

const sidebarItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "All Bookings", icon: CalendarDays },
  { label: "Slot Management", icon: Settings2 },
  { label: "Sports Management", icon: Trophy },
  { label: "Analytics", icon: BarChart3 },
];

const statCards = [
  { label: "Total Bookings", value: adminStats.totalBookings, icon: CalendarDays, gradient: "from-primary/15 to-accent/20" },
  { label: "Active Users", value: adminStats.activeUsers, icon: Users, gradient: "from-secondary/15 to-primary/10" },
  { label: "Most Popular Sport", value: adminStats.mostPopularSport, icon: Trophy, gradient: "from-accent/30 to-secondary/15" },
  { label: "Peak Booking Time", value: adminStats.peakTime, icon: TrendingUp, gradient: "from-primary/10 to-accent/25" },
];

export default function AdminPanel() {
  const navigate = useNavigate();
  const [active, setActive] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-primary text-primary-foreground transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-16 items-center justify-between px-6 border-b border-primary-foreground/10">
          <span className="font-extrabold text-lg flex items-center gap-2.5 tracking-tight">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-foreground/15">
              <Trophy className="h-4 w-4" />
            </div>
            Admin Panel
          </span>
          <button className="lg:hidden text-primary-foreground/70 hover:text-primary-foreground transition-colors" onClick={() => setSidebarOpen(false)}><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.label}
              onClick={() => { setActive(item.label); setSidebarOpen(false); }}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                active === item.label ? "bg-primary-foreground/20 shadow-md shadow-black/10" : "hover:bg-primary-foreground/10"
              }`}
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="px-4 pb-6 space-y-1">
          <button
            onClick={() => setDark(!dark)}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-primary-foreground/60 hover:bg-primary-foreground/10 hover:text-primary-foreground transition-all duration-200"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {dark ? "Light Mode" : "Dark Mode"}
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-primary-foreground/60 hover:bg-primary-foreground/10 hover:text-primary-foreground transition-all duration-200"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm lg:hidden transition-opacity" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card/80 backdrop-blur-xl px-4 sm:px-8">
          <button className="lg:hidden text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-muted p-2" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-bold text-foreground tracking-tight">{active}</h2>
        </header>

        <main className="flex-1 p-5 sm:p-8 lg:p-10">
          {active === "Dashboard" && (
            <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {statCards.map((card, i) => (
                <li
                  key={card.label}
                  className="list-none min-h-[10rem] animate-fade-up"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-border p-2 md:rounded-[1.5rem] md:p-3">
                    <GlowingEffect
                      spread={40}
                      glow={true}
                      disabled={false}
                      proximity={64}
                      inactiveZone={0.01}
                      borderWidth={3}
                    />
                    <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-xl border-[0.75px] bg-background p-7 shadow-sm hover:-translate-y-1 transition-all duration-300 dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)]">
                      <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-50 group-hover:opacity-80 transition-opacity duration-500`} />
                      <div className="relative">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-5 transition-transform duration-300 group-hover:scale-110">
                          <card.icon className="h-5.5 w-5.5" />
                        </div>
                        <div className="text-3xl font-extrabold text-foreground tracking-tight">{card.value}</div>
                        <div className="text-sm text-muted-foreground mt-1.5 font-medium">{card.label}</div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {active !== "Dashboard" && (
            <div className="flex items-center justify-center py-20 text-muted-foreground animate-fade-up">
              <p className="text-lg">{active} — UI coming soon.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
