import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trophy } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === "admin") {
      navigate("/admin");
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      {/* Decorative blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-accent/30 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-secondary/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-scale-in">
        <div className="rounded-3xl border bg-card/90 backdrop-blur-sm p-10 shadow-[var(--shadow-elevated)]">
          {/* Logo */}
          <div className="mb-10 flex flex-col items-center gap-4">
            <div className="flex h-18 w-18 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg transition-transform duration-300 hover:scale-110 hover:rotate-3">
              <Trophy className="h-9 w-9" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">UniSports</h1>
              <p className="text-sm text-muted-foreground mt-1">University Sports Slot Booking</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">Email / USN</Label>
              <Input
                id="email"
                placeholder="Enter your email or USN"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl transition-shadow duration-200 focus:shadow-lg focus:shadow-primary/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-xl transition-shadow duration-200 focus:shadow-lg focus:shadow-primary/10"
              />
            </div>
            <Button type="submit" className="w-full h-11 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0" size="lg">
              Sign In
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Type <span className="font-bold text-primary">admin</span> as email to access Admin Panel
          </p>
        </div>
      </div>
    </div>
  );
}
