import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { ArrowLeft, Trophy, UserPlus, Star, Trash2, Play } from "lucide-react";
import { toast } from "sonner";

interface Player { id: number; name: string; phone?: string; }
interface MatchPlayer { player_id: number; team: string; is_captain: boolean; name: string; }

export default function TeamSetup() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const numMatchId = Number(matchId);

  const [match, setMatch] = useState<any>(null);
  const [myPlayers, setMyPlayers] = useState<Player[]>([]);
  const [matchPlayers, setMatchPlayers] = useState<MatchPlayer[]>([]);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    // Fetch match
    supabase.from("matches").select("*").eq("id", numMatchId).single()
      .then(({ data }) => setMatch(data));
    // Fetch user's players
    if (user) {
      supabase.from("players").select("*").eq("user_id", user.id).order("name")
        .then(({ data }) => setMyPlayers(data || []));
    }
    // Fetch assigned players
    supabase.from("match_players").select("player_id, team, is_captain, players(name)")
      .eq("match_id", numMatchId)
      .then(({ data }) => {
        setMatchPlayers((data || []).map((mp: any) => ({
          player_id: mp.player_id,
          team: mp.team,
          is_captain: mp.is_captain,
          name: mp.players?.name || "Unknown",
        })));
      });
  }, [numMatchId, user]);

  const addPlayer = async () => {
    if (!user || !newName.trim()) return;
    const { data, error } = await supabase.from("players").insert({
      user_id: user.id,
      name: newName.trim(),
      phone: newPhone.trim() || null,
    }).select("id, name, phone").single();
    if (error) return toast.error(error.message);
    setMyPlayers((prev) => [...prev, data]);
    setNewName("");
    setNewPhone("");
    toast.success(`${data.name} added!`);
  };

  const assignPlayer = async (player: Player, team: "A" | "B") => {
    if (matchPlayers.some((mp) => mp.player_id === player.id)) {
      return toast.error(`${player.name} is already assigned`);
    }
    const { error } = await supabase.from("match_players").insert({
      match_id: numMatchId,
      player_id: player.id,
      team,
      is_captain: false,
    });
    if (error) return toast.error(error.message);
    setMatchPlayers((prev) => [...prev, { player_id: player.id, team, is_captain: false, name: player.name }]);
  };

  const removePlayer = async (playerId: number) => {
    await supabase.from("match_players").delete().eq("match_id", numMatchId).eq("player_id", playerId);
    setMatchPlayers((prev) => prev.filter((mp) => mp.player_id !== playerId));
  };

  const toggleCaptain = async (playerId: number, team: string) => {
    // Remove captain from same team first
    const teamPlayers = matchPlayers.filter((mp) => mp.team === team);
    for (const mp of teamPlayers) {
      if (mp.is_captain) {
        await supabase.from("match_players").update({ is_captain: false }).eq("match_id", numMatchId).eq("player_id", mp.player_id);
      }
    }
    await supabase.from("match_players").update({ is_captain: true }).eq("match_id", numMatchId).eq("player_id", playerId);
    setMatchPlayers((prev) => prev.map((mp) =>
      mp.team === team ? { ...mp, is_captain: mp.player_id === playerId } : mp
    ));
    toast.success("Captain set!");
  };

  const teamA = matchPlayers.filter((mp) => mp.team === "A");
  const teamB = matchPlayers.filter((mp) => mp.team === "B");

  const startMatch = async () => {
    if (teamA.length < 2 || teamB.length < 2) return toast.error("Need at least 2 players per team");
    if (!teamA.some((p) => p.is_captain)) return toast.error("Select captain for Team A");
    if (!teamB.some((p) => p.is_captain)) return toast.error("Select captain for Team B");

    setStarting(true);

    // Create innings
    await supabase.from("innings").insert([
      { match_id: numMatchId, innings_number: 1, team: "A", status: "ongoing" },
      { match_id: numMatchId, innings_number: 2, team: "B", status: "ongoing" },
    ]);

    // Create player stats for all
    const statsInserts = matchPlayers.map((mp) => ({
      match_id: numMatchId,
      player_id: mp.player_id,
    }));
    await supabase.from("player_stats").insert(statsInserts);

    // Update match status
    await supabase.from("matches").update({
      status: "ongoing",
      current_innings: 1,
      batting_team: "A",
      bowling_team: "B",
    }).eq("id", numMatchId);

    setStarting(false);
    toast.success("Match started!");
    navigate(`/scoring/${numMatchId}`);
  };

  if (!match) return (
    <div className="min-h-screen bg-black/[0.96] text-white flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-3 border-emerald-500 border-t-transparent" />
    </div>
  );

  return (
    <div className="min-h-screen bg-black/[0.96] text-white">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-emerald-500/[0.04] blur-[120px]" />
      </div>

      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors group">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back
          </button>
          <div className="flex items-center gap-2.5 font-extrabold text-lg">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500">
              <Trophy className="h-5 w-5" />
            </div>
            <span className="tracking-tight text-white hidden sm:inline">Team Setup</span>
          </div>
          <div />
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="mb-6 animate-fade-up">
          <h1 className="text-2xl font-extrabold sm:text-3xl tracking-tight">
            {match.team_a_name} vs {match.team_b_name}
          </h1>
          <p className="text-white/40 text-sm mt-1">{match.match_type} · {match.total_overs} overs</p>
        </div>

        {/* Add Player */}
        <div className="mb-8 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-3">Add Player</h3>
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Player name"
              className="flex-1 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 placeholder:text-white/20"
            />
            <input
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="Phone (optional)"
              className="w-36 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 placeholder:text-white/20"
            />
            <Button onClick={addPlayer} className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white px-4">
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Player Pool */}
        {myPlayers.length > 0 && (
          <div className="mb-8 animate-fade-up" style={{ animationDelay: "0.15s" }}>
            <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-3">
              Your Players — Click to Assign
            </h3>
            <div className="flex flex-wrap gap-2">
              {myPlayers.filter((p) => !matchPlayers.some((mp) => mp.player_id === p.id)).map((p) => (
                <div key={p.id} className="flex items-center gap-1">
                  <button
                    onClick={() => assignPlayer(p, "A")}
                    className="rounded-l-xl bg-blue-500/10 border border-blue-500/20 px-3 py-2 text-xs font-semibold text-blue-400 hover:bg-blue-500/20 transition-colors"
                  >
                    ← A
                  </button>
                  <span className="bg-white/[0.04] border-y border-white/[0.06] px-3 py-2 text-xs font-medium text-white/70">
                    {p.name}
                  </span>
                  <button
                    onClick={() => assignPlayer(p, "B")}
                    className="rounded-r-xl bg-orange-500/10 border border-orange-500/20 px-3 py-2 text-xs font-semibold text-orange-400 hover:bg-orange-500/20 transition-colors"
                  >
                    B →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Teams */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          {[
            { team: "A" as const, name: match.team_a_name, players: teamA, color: "blue" },
            { team: "B" as const, name: match.team_b_name, players: teamB, color: "orange" },
          ].map(({ team, name, players, color }) => (
            <div key={team} className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
              <div className="relative rounded-[1.25rem] border-[0.75px] border-white/[0.06] p-2 md:p-3">
                <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} borderWidth={3} />
                <div className="relative rounded-xl border-[0.75px] border-white/[0.06] bg-white/[0.03] p-5">
                  <h4 className={`font-bold text-lg mb-3 ${color === "blue" ? "text-blue-400" : "text-orange-400"}`}>
                    {name} ({players.length})
                  </h4>
                  {players.length === 0 ? (
                    <p className="text-xs text-white/30">No players assigned yet</p>
                  ) : (
                    <div className="space-y-2">
                      {players.map((mp) => (
                        <div key={mp.player_id} className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2">
                          <span className="text-sm font-medium text-white/80 flex-1">{mp.name}</span>
                          {mp.is_captain && (
                            <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                              Captain
                            </span>
                          )}
                          <button
                            onClick={() => toggleCaptain(mp.player_id, team)}
                            className={`p-1 rounded-lg transition-colors ${mp.is_captain ? "text-amber-400" : "text-white/20 hover:text-amber-400"}`}
                            title="Set Captain"
                          >
                            <Star className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => removePlayer(mp.player_id)}
                            className="p-1 rounded-lg text-white/20 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Start Match */}
        <div className="animate-fade-up" style={{ animationDelay: "0.3s" }}>
          <Button
            disabled={starting || teamA.length < 2 || teamB.length < 2}
            onClick={startMatch}
            className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-6 text-base shadow-lg shadow-emerald-500/20 disabled:opacity-40"
          >
            {starting ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Starting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Play className="h-5 w-5" /> Start Match
              </span>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
