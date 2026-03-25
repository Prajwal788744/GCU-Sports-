import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bookmark, Filter, Search, Star, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { formatRoleLabel, getSportProfileTeaser, normalizeSportProfile, type SportProfileRecord } from "@/lib/player-profile";

interface UserOption {
  id: string;
  name: string | null;
  reg_no: string | null;
  department: string | null;
  registration_year: number | null;
  avatar_url: string | null;
  preferred_role: string | null;
  preferred_sport_id: number | null;
  sport_profile: SportProfileRecord;
  course_code: string | null;
}

interface TeamMember extends UserOption {
  is_captain: boolean;
}

interface SavedTeam {
  id: number;
  name: string;
  members: TeamMember[];
}

function PlayerAvatar({ name, avatarUrl }: { name: string | null; avatarUrl: string | null }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name || "Player"} className="h-11 w-11 rounded-full object-cover border border-white/10" />;
  }

  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-xs font-bold text-white/60">
      {(name || "P").slice(0, 2).toUpperCase()}
    </div>
  );
}

export default function BookingTeamSetup() {
  const { bookingId } = useParams();
  const numBookingId = Number(bookingId);
  const navigate = useNavigate();
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  const [teamName, setTeamName] = useState("");
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState("my_department");
  const [myDepartment, setMyDepartment] = useState<string | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const [yearFilter, setYearFilter] = useState("my_year");
  const [myYear, setMyYear] = useState<number | null>(null);
  const [years, setYears] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [existingTeamId, setExistingTeamId] = useState<number | null>(null);
  const [savedTeams, setSavedTeams] = useState<SavedTeam[]>([]);

  const selectedIds = useMemo(() => new Set(members.map((member) => member.id)), [members]);
  const normalizedTeamName = teamName.trim().toLowerCase();
  const matchedSavedTeam = useMemo(
    () => savedTeams.find((team) => team.name.trim().toLowerCase() === normalizedTeamName),
    [normalizedTeamName, savedTeams]
  );

  useEffect(() => {
    if (!user || !numBookingId) return;

    const init = async () => {
      const [profileRes, deptRowsRes, yearRowsRes, bookingRes] = await Promise.all([
        supabase.from("users").select("department, registration_year").eq("id", user.id).single(),
        supabase.from("users").select("department").not("department", "is", null),
        supabase.from("users").select("registration_year").not("registration_year", "is", null),
        supabase.from("bookings").select("user_id").eq("id", numBookingId).single(),
      ]);

      setMyDepartment(profileRes.data?.department || null);
      setMyYear(profileRes.data?.registration_year || null);

      const uniqueDepartments = Array.from(
        new Set((deptRowsRes.data || []).map((row: { department: string | null }) => row.department).filter(Boolean))
      ) as string[];
      setDepartments(uniqueDepartments);

      const uniqueYears = Array.from(
        new Set(
          (yearRowsRes.data || [])
            .map((row: { registration_year: number | null }) => row.registration_year)
            .filter((value): value is number => typeof value === "number")
        )
      ).sort((a, b) => b - a);
      setYears(uniqueYears);

      const owner = bookingRes.data?.user_id === user.id;
      setIsOwner(owner);

      let allowed = owner;
      if (!owner) {
        const { data: req } = await supabase
          .from("match_requests")
          .select("id")
          .eq("booking_id", numBookingId)
          .eq("to_user_id", user.id)
          .eq("status", "accepted")
          .maybeSingle();
        allowed = !!req;
      }

      setCanEdit(allowed);
      if (!allowed) {
        toast.error("You are not allowed to manage a team for this booking.");
        navigate("/my-bookings", { replace: true });
        return;
      }

      const { data: myTeams } = await supabase
        .from("teams")
        .select("id, name")
        .eq("owner_user_id", user.id)
        .eq("sport_id", 1)
        .order("created_at", { ascending: false });

      const teamIds = (myTeams || []).map((team) => team.id);
      let savedTeamPlayers: any[] = [];
      if (teamIds.length > 0) {
        const { data } = await supabase
          .from("team_players")
          .select("team_id, is_captain, user_id, users(id, name, reg_no, department, registration_year, avatar_url, preferred_role, preferred_sport_id, sport_profile, course_code)")
          .in("team_id", teamIds);
        savedTeamPlayers = data || [];
      }

      const groupedSavedTeams = (myTeams || []).map((team) => ({
        id: team.id,
        name: team.name,
        members: savedTeamPlayers
          .filter((row) => row.team_id === team.id)
          .map((row) => ({
            id: row.users?.id,
            name: row.users?.name,
            reg_no: row.users?.reg_no,
            department: row.users?.department,
            registration_year: row.users?.registration_year,
            avatar_url: row.users?.avatar_url,
            preferred_role: row.users?.preferred_role,
            preferred_sport_id: row.users?.preferred_sport_id,
            sport_profile: normalizeSportProfile(row.users?.sport_profile),
            course_code: row.users?.course_code,
            is_captain: row.is_captain,
          }))
          .filter((member) => !!member.id),
      })) as SavedTeam[];
      setSavedTeams(groupedSavedTeams);

      const { data: bookingTeam } = await supabase
        .from("booking_teams")
        .select("team_id, teams(id, name)")
        .eq("booking_id", numBookingId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (bookingTeam?.team_id) {
        setExistingTeamId(Number(bookingTeam.team_id));
        setTeamName((bookingTeam.teams as { name?: string } | null)?.name || "");

        const { data: teamPlayers } = await supabase
          .from("team_players")
          .select("is_captain, user_id, users(id, name, reg_no, department, registration_year, avatar_url, preferred_role, preferred_sport_id, sport_profile, course_code)")
          .eq("team_id", bookingTeam.team_id);

        const mapped = (teamPlayers || []).map((row: any) => ({
          id: row.users?.id,
          name: row.users?.name,
          reg_no: row.users?.reg_no,
          department: row.users?.department,
          registration_year: row.users?.registration_year,
          avatar_url: row.users?.avatar_url,
          preferred_role: row.users?.preferred_role,
          preferred_sport_id: row.users?.preferred_sport_id,
          sport_profile: normalizeSportProfile(row.users?.sport_profile),
          course_code: row.users?.course_code,
          is_captain: row.is_captain,
        })) as TeamMember[];
        setMembers(mapped.filter((member) => !!member.id));
      }
    };

    void init();
  }, [navigate, numBookingId, user]);

  useEffect(() => {
    if (!canEdit) return;

    const queryTerm = searchTerm.trim();
    if (!queryTerm) {
      setUserOptions([]);
      return;
    }

    const run = async () => {
      setLoadingUsers(true);
      let query = supabase
        .from("users")
        .select("id, name, reg_no, department, registration_year, avatar_url, preferred_role, preferred_sport_id, sport_profile, course_code")
        .or(`name.ilike.%${queryTerm}%,reg_no.ilike.%${queryTerm}%`)
        .limit(20);

      if (departmentFilter === "my_department") {
        if (myDepartment) query = query.eq("department", myDepartment);
      } else if (departmentFilter !== "all") {
        query = query.eq("department", departmentFilter);
      }

      if (yearFilter === "my_year") {
        if (myYear) query = query.eq("registration_year", myYear);
      } else if (yearFilter !== "all") {
        query = query.eq("registration_year", Number(yearFilter));
      }

      const { data, error } = await query;
      setLoadingUsers(false);
      if (error) {
        toast.error(error.message || "Failed to search users.");
        return;
      }

      setUserOptions(
        ((data || []) as Array<Omit<UserOption, "sport_profile"> & { sport_profile: unknown }>).map((player) => ({
          ...player,
          sport_profile: normalizeSportProfile(player.sport_profile),
        }))
      );
    };

    const timeoutId = setTimeout(run, 250);
    return () => clearTimeout(timeoutId);
  }, [canEdit, departmentFilter, myDepartment, myYear, searchTerm, yearFilter]);

  const loadSavedTeam = (team: SavedTeam) => {
    setExistingTeamId(team.id);
    setTeamName(team.name);
    setMembers(team.members);
    setSearchTerm("");
    setUserOptions([]);
    toast.success(`Loaded ${team.name}. You can reuse it or edit it before saving.`);
  };

  const addMember = (candidate: UserOption) => {
    if (selectedIds.has(candidate.id)) return;

    setMembers((current) => [
      ...current,
      {
        ...candidate,
        is_captain: current.length === 0,
      },
    ]);
    setSearchTerm("");
    setUserOptions([]);
    inputRef.current?.focus();
  };

  const removeMember = (id: string) => {
    setMembers((current) => {
      const nextMembers = current.filter((member) => member.id !== id);
      if (nextMembers.length > 0 && !nextMembers.some((member) => member.is_captain)) {
        nextMembers[0] = { ...nextMembers[0], is_captain: true };
      }
      return nextMembers;
    });
  };

  const setCaptain = (id: string) => {
    setMembers((current) => current.map((member) => ({ ...member, is_captain: member.id === id })));
  };

  const saveTeam = async () => {
    if (!user || !canEdit) return;
    if (!teamName.trim()) return toast.error("Enter a team name.");
    if (members.length < 2) return toast.error("Add at least 2 players.");

    const captain = members.find((member) => member.is_captain);
    if (!captain) return toast.error("Choose a captain.");

    setSaving(true);

    const resolvedSavedTeam = matchedSavedTeam || null;
    let teamId = existingTeamId || resolvedSavedTeam?.id || null;

    if (!teamId) {
      const { data: newTeam, error } = await supabase
        .from("teams")
        .insert({ owner_user_id: user.id, name: teamName.trim(), sport_id: 1 })
        .select("id")
        .single();

      if (error || !newTeam) {
        setSaving(false);
        return toast.error(error?.message || "Failed to create team.");
      }

      teamId = Number(newTeam.id);
      setExistingTeamId(teamId);
    } else {
      const { error } = await supabase
        .from("teams")
        .update({ name: teamName.trim(), sport_id: 1 })
        .eq("id", teamId)
        .eq("owner_user_id", user.id);

      if (error) {
        setSaving(false);
        return toast.error(error.message || "Failed to update team.");
      }
    }

    const { error: bookingTeamError } = await supabase.from("booking_teams").upsert(
      { booking_id: numBookingId, user_id: user.id, team_id: teamId, is_owner: isOwner },
      { onConflict: "booking_id,user_id" }
    );

    if (bookingTeamError) {
      setSaving(false);
      return toast.error(bookingTeamError.message || "Failed to attach team to booking.");
    }

    const { data: bookingTeams } = await supabase
      .from("booking_teams")
      .select("team_id, user_id")
      .eq("booking_id", numBookingId);

    const linkedTeamIds = Array.from(
      new Set((bookingTeams || []).map((row) => Number(row.team_id)).filter((value) => Number.isFinite(value)))
    );

    const { data: linkedPlayers } = linkedTeamIds.length
      ? await supabase
          .from("team_players")
          .select("team_id, user_id")
          .in("team_id", linkedTeamIds)
      : { data: [] as Array<{ team_id: number; user_id: string }> };

    const bookingTeamLookup = new Map<string, number>();
    (linkedPlayers || []).forEach((row) => {
      if (!bookingTeamLookup.has(row.user_id)) {
        bookingTeamLookup.set(row.user_id, Number(row.team_id));
      }
    });

    const directMembers = members.filter((member) => {
      const currentBookingTeamId = bookingTeamLookup.get(member.id);
      return !currentBookingTeamId || currentBookingTeamId === teamId;
    });
    const switchMembers = members.filter((member) => {
      const currentBookingTeamId = bookingTeamLookup.get(member.id);
      return !!currentBookingTeamId && currentBookingTeamId !== teamId;
    });

    const { error: clearPlayersError } = await supabase.from("team_players").delete().eq("team_id", teamId);
    if (clearPlayersError) {
      setSaving(false);
      return toast.error(clearPlayersError.message || "Failed to refresh team members.");
    }

    const directInserts = directMembers.map((member) => ({
      team_id: teamId,
      user_id: member.id,
      is_captain: member.is_captain,
    }));

    if (directInserts.length > 0) {
      const { error: insertPlayersError } = await supabase.from("team_players").insert(directInserts);
      if (insertPlayersError) {
        setSaving(false);
        return toast.error(insertPlayersError.message || "Failed to save team players.");
      }
    }

    const directMemberIds = directMembers.map((member) => member.id).filter((id) => id !== user.id);
    if (directMemberIds.length > 0) {
      const { data: existingNotifications } = await supabase
        .from("notifications")
        .select("recipient_user_id")
        .eq("booking_id", numBookingId)
        .eq("team_id", teamId)
        .eq("type", "team_assignment")
        .in("recipient_user_id", directMemberIds);

      const alreadyNotified = new Set((existingNotifications || []).map((row) => row.recipient_user_id));
      const notificationRows = directMembers
        .filter((member) => member.id !== user.id && !alreadyNotified.has(member.id))
        .map((member) => ({
          recipient_user_id: member.id,
          actor_user_id: user.id,
          booking_id: numBookingId,
          team_id: teamId,
          type: "team_assignment",
          title: "You were added to a team",
          message: `${teamName.trim()} added you for booking #${numBookingId}.`,
          action_url: "/my-bookings",
          metadata: {
            captain: captain.name,
            teamName: teamName.trim(),
            bookingId: numBookingId,
          },
        }));

      if (notificationRows.length > 0) {
        await supabase.from("notifications").insert(notificationRows);
      }
    }

    let requestedSwitches = 0;
    if (switchMembers.length > 0) {
      const sourceTeamIds = Array.from(
        new Set(switchMembers.map((member) => bookingTeamLookup.get(member.id)).filter((value): value is number => !!value))
      );

      const { data: sourceTeams } = sourceTeamIds.length
        ? await supabase.from("teams").select("id, name").in("id", sourceTeamIds)
        : { data: [] as Array<{ id: number; name: string }> };

      const sourceTeamNameMap = new Map((sourceTeams || []).map((team) => [Number(team.id), team.name]));

      const { data: existingRequests } = await supabase
        .from("booking_player_requests")
        .select("user_id, source_team_id")
        .eq("booking_id", numBookingId)
        .eq("team_id", teamId)
        .eq("status", "pending");

      const pendingKeys = new Set(
        (existingRequests || []).map((request) => `${request.user_id}:${request.source_team_id || "none"}`)
      );

      const switchRequestRows = switchMembers
        .map((member) => {
          const sourceTeamId = bookingTeamLookup.get(member.id);
          if (!sourceTeamId) return null;
          const requestKey = `${member.id}:${sourceTeamId}`;
          if (pendingKeys.has(requestKey)) return null;

          return {
            booking_id: numBookingId,
            team_id: teamId,
            source_team_id: sourceTeamId,
            requested_by: user.id,
            user_id: member.id,
            request_type: "team_switch",
            status: "pending",
          };
        })
        .filter(Boolean) as Array<Record<string, string | number>>;

      if (switchRequestRows.length > 0) {
        const { error: switchRequestError } = await supabase.from("booking_player_requests").insert(switchRequestRows);
        if (switchRequestError) {
          setSaving(false);
          return toast.error(switchRequestError.message || "Failed to send player switch requests.");
        }

        requestedSwitches = switchRequestRows.length;

        const switchNotifications = switchMembers
          .map((member) => {
            const sourceTeamId = bookingTeamLookup.get(member.id);
            if (!sourceTeamId) return null;
            const requestKey = `${member.id}:${sourceTeamId}`;
            if (pendingKeys.has(requestKey)) return null;

            return {
              recipient_user_id: member.id,
              actor_user_id: user.id,
              booking_id: numBookingId,
              team_id: teamId,
              type: "team_switch",
              title: "Team switch request",
              message: `${teamName.trim()} wants you to leave ${sourceTeamNameMap.get(sourceTeamId) || "your current team"} and join them for booking #${numBookingId}.`,
              action_url: "/dashboard",
              metadata: {
                bookingId: numBookingId,
                targetTeamId: teamId,
                targetTeamName: teamName.trim(),
                sourceTeamId,
                sourceTeamName: sourceTeamNameMap.get(sourceTeamId) || "Current team",
              },
            };
          })
          .filter(Boolean);

        if (switchNotifications.length > 0) {
          await supabase.from("notifications").insert(switchNotifications);
        }
      }
    }

    setSaving(false);

    const summary = [
      `${directMembers.length} player${directMembers.length === 1 ? "" : "s"} ready in ${teamName.trim()}`,
      requestedSwitches > 0 ? `${requestedSwitches} switch request${requestedSwitches === 1 ? "" : "s"} sent` : null,
    ]
      .filter(Boolean)
      .join(" • ");

    toast.success(summary || "Team saved successfully.");
    navigate("/my-bookings");
  };

  return (
    <div className="min-h-screen bg-black/[0.96] text-white">
      <main className="mx-auto max-w-5xl px-4 py-8">
        <button onClick={() => navigate("/my-bookings")} className="mb-5 flex items-center gap-2 text-sm text-white/50 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Build Team</h1>
            <p className="mt-1 text-sm text-white/40">
              Booking #{numBookingId} • {isOwner ? "Booking owner team" : "Opponent captain team"}
            </p>
          </div>
          {matchedSavedTeam && matchedSavedTeam.id !== existingTeamId && (
            <button
              onClick={() => loadSavedTeam(matchedSavedTeam)}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-400"
            >
              <Bookmark className="h-3.5 w-3.5" />
              Load saved team: {matchedSavedTeam.name}
            </button>
          )}
        </div>

        {savedTeams.length > 0 && (
          <div className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
            <div className="flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-white/40" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">Saved Teams</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {savedTeams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => loadSavedTeam(team)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                    existingTeamId === team.id
                      ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
                      : "border-white/[0.08] bg-white/[0.03] text-white/60 hover:text-white"
                  }`}
                >
                  {team.name} <span className="text-white/30">({team.members.length})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
          <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-white/40">Team Name</label>
          <input
            value={teamName}
            onChange={(event) => setTeamName(event.target.value)}
            className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.05] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-emerald-500/40"
            placeholder="Type a new team name or an existing saved team name"
          />
          <p className="mt-2 text-xs text-white/25">
            Enter the same team name next time to pull your saved squad back in without adding everyone again.
          </p>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
            <div className="mb-4 flex items-center gap-2">
              <Filter className="h-4 w-4 text-white/40" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">Player Filters</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={departmentFilter}
                onChange={(event) => setDepartmentFilter(event.target.value)}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.05] px-3 py-3 text-sm text-white outline-none"
              >
                <option value="my_department">My Department</option>
                <option value="all">All Departments</option>
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>

              <select
                value={yearFilter}
                onChange={(event) => setYearFilter(event.target.value)}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.05] px-3 py-3 text-sm text-white outline-none"
              >
                <option value="my_year">My Year</option>
                <option value="all">All Years</option>
                {years.map((year) => (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative mt-4">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-white/30" />
              <input
                ref={inputRef}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search signed-up users by name or registration number"
                className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.05] py-3 pl-10 pr-4 text-sm text-white outline-none transition-colors focus:border-emerald-500/40"
              />

              {searchTerm.trim() && (
                <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-black/95 shadow-2xl">
                  {loadingUsers ? (
                    <div className="px-4 py-3 text-xs text-white/40">Searching players...</div>
                  ) : userOptions.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-white/40">No players found for this filter.</div>
                  ) : (
                    userOptions.map((player) => (
                      <button
                        key={player.id}
                        onClick={() => addMember(player)}
                        className="flex w-full items-center gap-3 border-b border-white/[0.05] px-4 py-3 text-left transition-colors hover:bg-white/[0.06] last:border-0"
                      >
                        <PlayerAvatar name={player.name} avatarUrl={player.avatar_url} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-white">
                            {player.name || "Unnamed user"}
                          </div>
                          <div className="mt-1 truncate text-[11px] text-white/40">
                            {player.reg_no || "No reg no"}
                            {player.department ? ` • ${player.department}` : ""}
                            {typeof player.registration_year === "number" ? ` • ${player.registration_year}` : ""}
                          </div>
                          <div className="mt-1 text-[11px] text-emerald-400/70">
                            {getSportProfileTeaser(player.preferred_sport_id, player.sport_profile, player.preferred_role) ||
                              (player.preferred_role ? formatRoleLabel(player.preferred_role) : "Role not set yet")}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <p className="mt-3 text-xs text-white/25">
              If a selected player already belongs to the other team for this booking, they will receive an accept or reject request instead of being moved instantly.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-white/40" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">Team Preview</span>
            </div>
            <div className="mt-4 space-y-3">
              {members.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-8 text-center text-sm text-white/30">
                  No players selected yet.
                </div>
              ) : (
                members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.03] px-3 py-3">
                    <PlayerAvatar name={member.name} avatarUrl={member.avatar_url} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-white">{member.name || "Unnamed user"}</div>
                      <div className="mt-1 truncate text-[11px] text-white/40">
                        {member.reg_no || "No reg no"}
                        {member.department ? ` • ${member.department}` : ""}
                        {typeof member.registration_year === "number" ? ` • ${member.registration_year}` : ""}
                      </div>
                      <div className="mt-1 text-[11px] text-emerald-400/70">
                        {getSportProfileTeaser(member.preferred_sport_id, member.sport_profile, member.preferred_role) ||
                          (member.preferred_role ? formatRoleLabel(member.preferred_role) : "Role not set yet")}
                      </div>
                    </div>
                    <button
                      onClick={() => setCaptain(member.id)}
                      className={`rounded-xl p-2 transition-colors ${
                        member.is_captain ? "bg-amber-500/20 text-amber-400" : "text-white/30 hover:text-amber-400"
                      }`}
                      title="Set captain"
                    >
                      <Star className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeMember(member.id)}
                      className="rounded-xl p-2 text-white/30 transition-colors hover:text-red-400"
                      title="Remove player"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <Button
          onClick={saveTeam}
          disabled={saving}
          className="mt-6 w-full rounded-2xl bg-emerald-500 py-6 text-base font-semibold text-white hover:bg-emerald-600"
        >
          {saving ? "Saving Team..." : "Save Team"}
        </Button>
      </main>
    </div>
  );
}
