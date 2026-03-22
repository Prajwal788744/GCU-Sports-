import { StudentNavbar } from "@/components/StudentNavbar";
import { SportCard } from "@/components/SportCard";
import { sports } from "@/data/mockData";
import { useAuth } from "@/hooks/useAuth";

export default function Dashboard() {
  const { user } = useAuth();
  const userName = user?.user_metadata?.name || "Student";

  return (
    <div className="min-h-screen">
      <StudentNavbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-12">
        <div className="mb-10 animate-fade-up">
          <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl tracking-tight">Welcome back, {userName}! 👋</h1>
          <p className="mt-2 text-muted-foreground text-base">Choose a sport and book your slot.</p>
        </div>

        <ul className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {sports.map((sport, i) => (
            <SportCard key={sport.id} sport={sport} index={i} />
          ))}
        </ul>
      </main>
    </div>
  );
}
