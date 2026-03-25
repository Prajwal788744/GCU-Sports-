import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Building2, CheckCircle2, Trophy } from "lucide-react";
import { toast } from "sonner";
import {
  SPORT_META_BY_ID,
  buildPreferredRole,
  getSportProfileConfig,
  getSportProfileSummaryItems,
  getVisibleSportProfileFields,
  normalizeSportProfile,
  parseRegistrationNumber,
  sanitizeSportProfile,
  seedSportProfileFromRole,
  type SportProfileRecord,
} from "@/lib/player-profile";

interface Sport {
  id: number;
  name: string;
}

interface OnboardingDialogProps {
  user: User;
  open: boolean;
  onComplete: () => void;
}

type Step = "sport" | "profile" | "department";

function resolveStep(sportId: number | null, sportProfile: SportProfileRecord, department: string): Step {
  if (!sportId) return "sport";

  const preferredRole = buildPreferredRole(sportId, sportProfile);
  const visibleFields = getVisibleSportProfileFields(sportId, sportProfile, preferredRole);
  const profileComplete = visibleFields.every((field) => !field.required || !!sportProfile[field.key]);

  if (!profileComplete) return "profile";
  if (!department.trim()) return "department";
  return "department";
}

export default function OnboardingDialog({ user, open, onComplete }: OnboardingDialogProps) {
  const [sports, setSports] = useState<Sport[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);
  const [selectedSportId, setSelectedSportId] = useState<number | null>(null);
  const [sportProfile, setSportProfile] = useState<SportProfileRecord>({});
  const [department, setDepartment] = useState("");
  const [step, setStep] = useState<Step>("sport");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selectedSportMeta = selectedSportId ? SPORT_META_BY_ID[selectedSportId] : null;
  const profileConfig = getSportProfileConfig(selectedSportId);
  const selectedRole = buildPreferredRole(selectedSportId, sportProfile);
  const visibleProfileFields = getVisibleSportProfileFields(selectedSportId, sportProfile, selectedRole);
  const profileComplete = visibleProfileFields.every((field) => !field.required || !!sportProfile[field.key]);
  const canContinueFromSport = !!selectedSportId;
  const canContinueFromProfile = !!selectedRole && profileComplete;
  const canSubmit = canContinueFromSport && canContinueFromProfile && !!department.trim();
  const playerDisplayName = (user.user_metadata.name as string | undefined) || "New Player";
  const playerRegNo = (user.user_metadata.reg_no as string | undefined) || "Registration pending";

  const recommendedDepartments = useMemo(() => departmentOptions.slice(0, 6), [departmentOptions]);
  const summaryItems = useMemo(
    () => getSportProfileSummaryItems(selectedSportId, sportProfile, selectedRole),
    [selectedRole, selectedSportId, sportProfile]
  );
  const groupedProfileSections = useMemo(() => {
    const sectionMap = new Map<
      string,
      { title: string; description: string; fields: typeof visibleProfileFields }
    >();

    visibleProfileFields.forEach((field) => {
      const title = field.sectionTitle || "Profile Details";
      const existingSection = sectionMap.get(title);

      if (existingSection) {
        existingSection.fields.push(field);
        if (!existingSection.description && field.sectionDescription) {
          existingSection.description = field.sectionDescription;
        }
        return;
      }

      sectionMap.set(title, {
        title,
        description: field.sectionDescription || "Complete the fields below to finish your player registration.",
        fields: [field],
      });
    });

    return Array.from(sectionMap.values());
  }, [visibleProfileFields]);
  const completedFieldCount = visibleProfileFields.filter((field) => !!sportProfile[field.key]).length;

  useEffect(() => {
    if (!open) return;

    let active = true;

    const load = async () => {
      setLoading(true);

      const [sportsRes, profileRes, departmentsRes] = await Promise.all([
        supabase.from("sports").select("id, name").order("id"),
        supabase
          .from("users")
          .select("department, preferred_sport_id, preferred_role, sport_profile")
          .eq("id", user.id)
          .maybeSingle(),
        supabase.from("users").select("department").not("department", "is", null),
      ]);

      if (!active) return;

      setSports((sportsRes.data || []) as Sport[]);

      const existingProfile = profileRes.data;
      const existingSportId = existingProfile?.preferred_sport_id || null;
      const existingDepartment = existingProfile?.department || "";
      const normalizedProfile = seedSportProfileFromRole(
        existingSportId,
        existingProfile?.preferred_role,
        normalizeSportProfile(existingProfile?.sport_profile)
      );
      const sanitizedProfile = sanitizeSportProfile(
        existingSportId,
        normalizedProfile,
        buildPreferredRole(existingSportId, normalizedProfile)
      );

      setSelectedSportId(existingSportId);
      setSportProfile(sanitizedProfile);
      setDepartment(existingDepartment);
      setStep(resolveStep(existingSportId, sanitizedProfile, existingDepartment));

      const uniqueDepartments = Array.from(
        new Set(
          (departmentsRes.data || [])
            .map((row: { department: string | null }) => row.department?.trim())
            .filter(Boolean)
        )
      )
        .sort((left, right) => left.localeCompare(right)) as string[];

      setDepartmentOptions(uniqueDepartments);
      setLoading(false);
    };

    void load();

    return () => {
      active = false;
    };
  }, [open, user.id]);

  const handleSportSelect = (sportId: number) => {
    setSelectedSportId(sportId);
    setSportProfile({});
  };

  const handleFieldSelect = (fieldKey: string, optionValue: string) => {
    setSportProfile((current) => {
      const nextProfile = {
        ...current,
        [fieldKey]: optionValue,
      };

      const nextRole = buildPreferredRole(selectedSportId, nextProfile);
      return sanitizeSportProfile(selectedSportId, nextProfile, nextRole);
    });
  };

  const saveOnboarding = async () => {
    if (!canSubmit || !selectedSportId) {
      toast.error("Complete your athlete profile and department to continue.");
      return;
    }

    setSaving(true);

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("name, reg_no, avatar_url")
      .eq("id", user.id)
      .single();

    if (profileError) {
      setSaving(false);
      toast.error(profileError.message || "Unable to load your profile.");
      return;
    }

    const regMeta = parseRegistrationNumber(profile?.reg_no || (user.user_metadata.reg_no as string | undefined));
    const sanitizedProfile = sanitizeSportProfile(selectedSportId, sportProfile, selectedRole);
    const trimmedDepartment = department.trim();

    const { error: updateError } = await supabase
      .from("users")
      .update({
        preferred_sport_id: selectedSportId,
        preferred_role: selectedRole,
        sport_profile: sanitizedProfile,
        department: trimmedDepartment,
        registration_year: regMeta.registrationYear,
        course_code: regMeta.courseCode,
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      setSaving(false);
      toast.error(updateError.message || "Failed to save onboarding.");
      return;
    }

    const { error: playerError } = await supabase.from("players").upsert(
      {
        user_id: user.id,
        name: profile?.name || (user.user_metadata.name as string | undefined) || "Player",
        photo_url: profile?.avatar_url || null,
        role: selectedRole || null,
        sport_profile: sanitizedProfile,
      },
      { onConflict: "user_id" }
    );

    if (playerError) {
      setSaving(false);
      toast.error(playerError.message || "Failed to sync your player profile.");
      return;
    }

    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("gcu_pending_onboarding_user");
    }

    setSaving(false);
    toast.success("Athlete profile completed successfully.");
    onComplete();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
      <div className="relative flex min-h-full items-start justify-center py-4">
        <div className="relative w-full max-w-5xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[2rem] border border-white/[0.08] bg-black/95 text-white shadow-2xl">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-10 top-10 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="absolute bottom-0 right-10 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl" />
          </div>

          <div className="relative grid gap-0 lg:grid-cols-[0.95fr_1.25fr]">
            <div className="border-b border-white/[0.06] p-8 lg:border-b-0 lg:border-r">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white">
                <Trophy className="h-6 w-6" />
              </div>
              <h2 className="mt-6 text-3xl font-black tracking-tight">Welcome to GCU Sports</h2>
              <p className="mt-3 text-sm leading-6 text-white/55">
                This one-time onboarding builds a proper athlete profile for team selection, booking squads, and match
                presentations.
              </p>

              <div className="mt-8 space-y-3">
                {[
                  {
                    key: "sport",
                    label: "Choose your sport",
                    complete: !!selectedSportId,
                  },
                  {
                    key: "profile",
                    label: selectedSportMeta ? `Complete your ${selectedSportMeta.name.toLowerCase()} profile` : "Complete your athlete profile",
                    complete: canContinueFromProfile,
                  },
                  {
                    key: "department",
                    label: "Confirm your department",
                    complete: !!department.trim(),
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className={`rounded-2xl border px-4 py-3 text-sm ${
                      step === item.key
                        ? "border-emerald-500/40 bg-emerald-500/10 text-white"
                        : item.complete
                        ? "border-white/[0.06] bg-white/[0.03] text-white/70"
                        : "border-white/[0.05] bg-white/[0.02] text-white/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span>{item.label}</span>
                      {item.complete && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-[1.75rem] border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-400/75">Player Registration</p>
                    <h3 className="mt-3 text-xl font-black tracking-tight text-white">{playerDisplayName}</h3>
                    <p className="mt-1 text-sm text-white/40">{playerRegNo}</p>
                  </div>
                  <div className="rounded-full border border-white/[0.08] bg-black/25 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white/45">
                    New Player
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/[0.06] bg-black/20 px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/30">Sport</p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {selectedSportMeta ? `${selectedSportMeta.emoji} ${selectedSportMeta.name}` : "Not selected"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/[0.06] bg-black/20 px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/30">Department</p>
                    <p className="mt-2 text-sm font-semibold text-white">{department.trim() || "Not selected"}</p>
                  </div>
                </div>

                {summaryItems.length > 0 && (
                  <div className="mt-4 rounded-2xl border border-white/[0.06] bg-black/20 px-4 py-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/30">Current Profile</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {summaryItems.map((item) => (
                        <span
                          key={item.label}
                          className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300"
                        >
                          {item.value}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-8">
            {loading ? (
              <div className="flex min-h-[30rem] items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
              </div>
            ) : (
              <div className="min-h-[30rem]">
                {step === "sport" && (
                  <>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-400/80">Step 1</p>
                    <h3 className="mt-3 text-2xl font-black tracking-tight">Choose your main sport</h3>
                    <p className="mt-2 text-sm text-white/50">
                      Start with the sport you want your athlete profile to be built around.
                    </p>

                    <div className="mt-8 grid gap-4 sm:grid-cols-3">
                      {sports.map((sport) => {
                        const meta = SPORT_META_BY_ID[sport.id] || {
                          emoji: "🏅",
                          name: sport.name,
                          description: "Create an athlete profile for this sport.",
                          onboardingTitle: sport.name,
                          onboardingDescription: "Create an athlete profile for this sport.",
                        };

                        return (
                          <button
                            key={sport.id}
                            onClick={() => handleSportSelect(sport.id)}
                            className={`rounded-[1.5rem] border p-5 text-left transition-all ${
                              selectedSportId === sport.id
                                ? "border-emerald-500/40 bg-emerald-500/12 shadow-lg shadow-emerald-500/10"
                                : "border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.05]"
                            }`}
                          >
                            <div className="text-4xl">{meta.emoji}</div>
                            <h4 className="mt-5 text-lg font-bold text-white">{meta.name}</h4>
                            <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-400/70">
                              {meta.onboardingTitle}
                            </p>
                            <p className="mt-3 text-sm leading-6 text-white/45">{meta.onboardingDescription}</p>
                          </button>
                        );
                      })}
                    </div>

                    <Button
                      onClick={() => setStep(profileConfig ? "profile" : "department")}
                      disabled={!canContinueFromSport}
                      className="mt-8 rounded-xl bg-emerald-500 px-6 py-6 text-base font-semibold text-white hover:bg-emerald-600"
                    >
                      Continue
                    </Button>
                  </>
                )}

                {step === "profile" && profileConfig && selectedSportMeta && (
                  <>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-400/80">Step 2</p>
                    <h3 className="mt-3 text-2xl font-black tracking-tight">
                      {selectedSportMeta.emoji} {profileConfig.heading}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-white/50">{profileConfig.intro}</p>

                    <div className="mt-6 rounded-[1.6rem] border border-white/[0.08] bg-white/[0.03] p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/35">Registration Progress</p>
                          <p className="mt-2 text-sm text-white/55">
                            Choose your primary role first. We will show only the follow-up fields that match that role.
                          </p>
                        </div>
                        <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300">
                          {completedFieldCount}/{visibleProfileFields.length} completed
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 space-y-4">
                      {groupedProfileSections.map((section) => (
                        <section key={section.title} className="rounded-[1.5rem] border border-white/[0.07] bg-white/[0.03] p-5">
                          <div className="flex flex-col gap-2 border-b border-white/[0.06] pb-4">
                            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-400/70">{section.title}</p>
                            <p className="text-sm leading-6 text-white/50">{section.description}</p>
                          </div>

                          <div className="mt-4 space-y-4">
                            {section.fields.map((field) => (
                              <div key={field.key} className="rounded-[1.25rem] border border-white/[0.06] bg-black/20 p-4">
                                <div className="mb-3 flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-bold text-white">{field.label}</p>
                                    <p className="mt-1 text-xs leading-5 text-white/45">{field.description}</p>
                                  </div>
                                  {sportProfile[field.key] && (
                                    <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">
                                      Selected
                                    </span>
                                  )}
                                </div>

                                <div className={`grid gap-3 ${field.options.length > 5 ? "sm:grid-cols-2 xl:grid-cols-3" : "sm:grid-cols-2"}`}>
                                  {field.options.map((option) => {
                                    const isSelected = sportProfile[field.key] === option.value;

                                    return (
                                      <button
                                        key={option.value}
                                        onClick={() => handleFieldSelect(field.key, option.value)}
                                        className={`rounded-[1.15rem] border px-4 py-3 text-left transition-all ${
                                          isSelected
                                            ? "border-amber-500/40 bg-amber-500/12 shadow-lg shadow-amber-500/10"
                                            : "border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.05]"
                                        }`}
                                      >
                                        <div className="flex items-start justify-between gap-3">
                                          <h4 className="text-sm font-bold text-white">{option.label}</h4>
                                          <span
                                            className={`mt-0.5 h-2.5 w-2.5 rounded-full ${
                                              isSelected ? "bg-amber-400" : "bg-white/15"
                                            }`}
                                          />
                                        </div>
                                        <p className="mt-2 text-xs leading-5 text-white/45">{option.description}</p>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>
                      ))}
                    </div>

                    <div className="mt-8 flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setStep("sport")}
                        className="rounded-xl border-white/[0.12] bg-transparent px-6 py-6 text-white hover:bg-white/[0.05]"
                      >
                        Back
                      </Button>
                      <Button
                        onClick={() => setStep("department")}
                        disabled={!canContinueFromProfile}
                        className="rounded-xl bg-emerald-500 px-6 py-6 text-base font-semibold text-white hover:bg-emerald-600"
                      >
                        Continue
                      </Button>
                    </div>
                  </>
                )}

                {step === "department" && (
                  <>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-400/80">Step 3</p>
                    <h3 className="mt-3 text-2xl font-black tracking-tight">Confirm your department</h3>
                    <p className="mt-2 text-sm text-white/50">
                      Department and registration year help booking owners find the right players faster when they build teams.
                    </p>

                    <div className="mt-8 rounded-[1.5rem] border border-white/[0.07] bg-white/[0.03] p-5">
                      <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-white/35">
                        <Building2 className="h-4 w-4" />
                        Department
                      </label>
                      <input
                        value={department}
                        onChange={(event) => setDepartment(event.target.value)}
                        placeholder="Example: Biotechnology, Computer Science, MBA"
                        className="mt-4 w-full rounded-2xl border border-white/[0.08] bg-black/40 px-4 py-3 text-base text-white outline-none transition-colors placeholder:text-white/25 focus:border-emerald-500/40"
                      />

                      {recommendedDepartments.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {recommendedDepartments.map((dept) => (
                            <button
                              key={dept}
                              onClick={() => setDepartment(dept)}
                              className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-white/60 transition-colors hover:border-emerald-500/30 hover:text-white"
                            >
                              {dept}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-8 flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setStep(profileConfig ? "profile" : "sport")}
                        className="rounded-xl border-white/[0.12] bg-transparent px-6 py-6 text-white hover:bg-white/[0.05]"
                      >
                        Back
                      </Button>
                      <Button
                        onClick={saveOnboarding}
                        disabled={!canSubmit || saving}
                        className="rounded-xl bg-emerald-500 px-6 py-6 text-base font-semibold text-white hover:bg-emerald-600"
                      >
                        {saving ? "Saving..." : "Finish Onboarding"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
