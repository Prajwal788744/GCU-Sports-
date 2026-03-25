export type SportProfileRecord = Record<string, string>;

export interface RegistrationMeta {
  normalizedRegNo: string | null;
  registrationYear: number | null;
  courseCode: string | null;
}

export interface SportMeta {
  id: number;
  name: string;
  emoji: string;
  description: string;
  onboardingTitle: string;
  onboardingDescription: string;
}

export interface SportProfileOption {
  value: string;
  label: string;
  description: string;
}

export interface SportProfileVisibilityRule {
  fieldKey: string;
  values: string[];
}

export interface SportProfileField {
  key: string;
  label: string;
  description: string;
  sectionTitle?: string;
  sectionDescription?: string;
  required?: boolean;
  primary?: boolean;
  visibleWhen?: SportProfileVisibilityRule[];
  options: SportProfileOption[];
}

export interface SportProfileConfig {
  sportId: number;
  heading: string;
  intro: string;
  fields: SportProfileField[];
}

export const SPORT_META_BY_ID: Record<number, SportMeta> = {
  1: {
    id: 1,
    name: "Cricket",
    emoji: "🏏",
    description: "Role, batting style, bowling style, and batting position.",
    onboardingTitle: "Build your cricket player card",
    onboardingDescription:
      "Model your profile like a professional cricketer with a primary role, batting style, bowling type, and batting slot.",
  },
  2: {
    id: 2,
    name: "Futsal",
    emoji: "⚽",
    description: "Position, support role, preferred foot, and playing identity.",
    onboardingTitle: "Define your futsal identity",
    onboardingDescription:
      "Set your position the way futsal teams describe players on the court, including ala, pivot, fixo, and universal roles.",
  },
  3: {
    id: 3,
    name: "Badminton",
    emoji: "🏸",
    description: "Discipline, handedness, playing style, and court preference.",
    onboardingTitle: "Create your badminton athlete profile",
    onboardingDescription:
      "Capture the profile details coaches and players actually use, from discipline and handedness to front-court or back-court preference.",
  },
};

export const SPORT_PROFILE_CONFIG: Record<number, SportProfileConfig> = {
  1: {
    sportId: 1,
    heading: "Cricket athlete profile",
    intro:
      "Professional cricket profiles usually identify a player's role, batting style, and bowling style. Choose the options that best reflect how you actually play.",
    fields: [
      {
        key: "primary_role",
        label: "Primary Role",
        description: "This is your main cricket role in the squad.",
        sectionTitle: "Role Selection",
        sectionDescription: "Start with the role that best represents how you normally contribute in cricket.",
        required: true,
        primary: true,
        options: [
          {
            value: "batter",
            label: "Batter",
            description: "Your main contribution is with the bat.",
          },
          {
            value: "bowler",
            label: "Bowler",
            description: "You lead with bowling and usually bowl your full spell.",
          },
          {
            value: "all_rounder",
            label: "All-rounder",
            description: "You regularly contribute with both bat and ball.",
          },
          {
            value: "wicketkeeper",
            label: "Wicketkeeper",
            description: "You keep wickets and support the batting unit.",
          },
        ],
      },
      {
        key: "batting_style",
        label: "Batting Style",
        description: "Choose your batting handedness.",
        sectionTitle: "Batting Profile",
        sectionDescription: "Add the batting details selectors and captains usually want to know first.",
        required: true,
        visibleWhen: [
          {
            fieldKey: "primary_role",
            values: ["batter", "all_rounder", "wicketkeeper"],
          },
        ],
        options: [
          {
            value: "right_hand_batter",
            label: "Right-hand batter",
            description: "You bat right-handed.",
          },
          {
            value: "left_hand_batter",
            label: "Left-hand batter",
            description: "You bat left-handed.",
          },
          {
            value: "switch_hitter",
            label: "Switch-hitter",
            description: "You are comfortable changing stance based on matchups.",
          },
        ],
      },
      {
        key: "bowling_style",
        label: "Bowling Style",
        description: "Select the bowling type you use most often.",
        sectionTitle: "Bowling Profile",
        sectionDescription: "Pick the bowling discipline that matches your natural style and match role.",
        required: true,
        visibleWhen: [
          {
            fieldKey: "primary_role",
            values: ["bowler", "all_rounder"],
          },
        ],
        options: [
          {
            value: "non_bowler",
            label: "Non-bowler",
            description: "You normally do not bowl in matches.",
          },
          {
            value: "right_arm_fast",
            label: "Right-arm fast",
            description: "Pace bowling with emphasis on speed.",
          },
          {
            value: "right_arm_fast_medium",
            label: "Right-arm fast-medium",
            description: "Pace bowling with control and seam movement.",
          },
          {
            value: "right_arm_medium",
            label: "Right-arm medium",
            description: "Medium pace focused on accuracy and variation.",
          },
          {
            value: "right_arm_off_break",
            label: "Right-arm off-break",
            description: "Finger spin turning away from a left-handed batter.",
          },
          {
            value: "right_arm_leg_break",
            label: "Right-arm leg-break",
            description: "Wrist spin turning away from a right-handed batter.",
          },
          {
            value: "left_arm_fast",
            label: "Left-arm fast",
            description: "Left-arm pace focused on speed and bounce.",
          },
          {
            value: "left_arm_fast_medium",
            label: "Left-arm fast-medium",
            description: "Left-arm seam bowling with movement and control.",
          },
          {
            value: "left_arm_orthodox",
            label: "Left-arm orthodox",
            description: "Slow left-arm finger spin.",
          },
          {
            value: "left_arm_wrist_spin",
            label: "Left-arm wrist spin",
            description: "Left-arm wrist spin with turn and variation.",
          },
        ],
      },
      {
        key: "batting_position",
        label: "Batting Position",
        description: "Pick the batting slot you play most often.",
        sectionTitle: "Batting Profile",
        sectionDescription: "Add the batting details selectors and captains usually want to know first.",
        required: true,
        visibleWhen: [
          {
            fieldKey: "primary_role",
            values: ["batter", "all_rounder", "wicketkeeper"],
          },
        ],
        options: [
          {
            value: "opener",
            label: "Opener",
            description: "You regularly open the innings.",
          },
          {
            value: "top_order",
            label: "Top order",
            description: "You usually bat at number 3 or 4.",
          },
          {
            value: "middle_order",
            label: "Middle order",
            description: "You stabilize or accelerate through the middle overs.",
          },
          {
            value: "finisher",
            label: "Finisher",
            description: "You close out the innings in the death overs.",
          },
          {
            value: "lower_order",
            label: "Lower order",
            description: "You usually bat near the end of the lineup.",
          },
        ],
      },
      {
        key: "keeping_role",
        label: "Wicketkeeping Role",
        description: "Tell us how you usually contribute as a wicketkeeper.",
        sectionTitle: "Keeping Profile",
        sectionDescription: "Describe the type of wicketkeeper role you most often play in a team.",
        required: true,
        visibleWhen: [
          {
            fieldKey: "primary_role",
            values: ["wicketkeeper"],
          },
        ],
        options: [
          {
            value: "specialist_wicketkeeper",
            label: "Specialist wicketkeeper",
            description: "You focus first on glove work, takes, and match control behind the stumps.",
          },
          {
            value: "wicketkeeper_batter",
            label: "Wicketkeeper-batter",
            description: "You contribute behind the stumps and play a major batting role.",
          },
          {
            value: "opening_wicketkeeper",
            label: "Opening wicketkeeper",
            description: "You keep wickets and regularly open the batting.",
          },
        ],
      },
    ],
  },
  2: {
    sportId: 2,
    heading: "Futsal athlete profile",
    intro:
      "Futsal profiles usually describe a player's court position, support role, preferred foot, and playing identity. Choose the role set that best matches your game.",
    fields: [
      {
        key: "primary_role",
        label: "Primary Position",
        description: "Select the role you play most often in futsal.",
        sectionTitle: "Position Selection",
        sectionDescription: "Choose the on-court role that best defines your futsal game.",
        required: true,
        primary: true,
        options: [
          {
            value: "goalkeeper",
            label: "Goalkeeper",
            description: "Last line of defense and first phase of buildup.",
          },
          {
            value: "fixo",
            label: "Fixo",
            description: "Defensive organizer who starts attacks from the back.",
          },
          {
            value: "ala",
            label: "Ala",
            description: "Wide player who creates and recovers on both phases.",
          },
          {
            value: "pivot",
            label: "Pivot",
            description: "Advanced target player who holds the ball and finishes moves.",
          },
          {
            value: "universal",
            label: "Universal",
            description: "Flexible outfield player who can cover multiple roles.",
          },
        ],
      },
      {
        key: "support_role",
        label: "Support Role",
        description: "Choose the secondary role you can comfortably cover.",
        sectionTitle: "Position Coverage",
        sectionDescription: "Show where else you can help the team when rotations or tactics demand it.",
        required: true,
        visibleWhen: [
          {
            fieldKey: "primary_role",
            values: ["fixo", "ala", "pivot", "universal"],
          },
        ],
        options: [
          {
            value: "none",
            label: "Specialist in one role",
            description: "You prefer to stay in your main position.",
          },
          {
            value: "fixo",
            label: "Fixo support",
            description: "You can step into the defensive organizer role.",
          },
          {
            value: "ala",
            label: "Ala support",
            description: "You can operate as a wide transitional player.",
          },
          {
            value: "pivot",
            label: "Pivot support",
            description: "You can play higher and act as the reference point in attack.",
          },
          {
            value: "universal",
            label: "Universal support",
            description: "You can rotate across multiple outfield roles.",
          },
        ],
      },
      {
        key: "goalkeeping_style",
        label: "Goalkeeping Style",
        description: "Describe the kind of goalkeeper you are in futsal.",
        sectionTitle: "Goalkeeper Details",
        sectionDescription: "Highlight the kind of goalkeeper profile you bring to the match.",
        required: true,
        visibleWhen: [
          {
            fieldKey: "primary_role",
            values: ["goalkeeper"],
          },
        ],
        options: [
          {
            value: "shot_stopper",
            label: "Shot-stopper",
            description: "You lead with reflex saves and close-range control.",
          },
          {
            value: "sweeper_keeper",
            label: "Sweeper-keeper",
            description: "You step high, cover space, and support buildup outside the area.",
          },
          {
            value: "distributor",
            label: "Distributor",
            description: "You start attacks quickly with accurate throws and passes.",
          },
        ],
      },
      {
        key: "preferred_foot",
        label: "Preferred Foot",
        description: "Tell teammates which foot you naturally trust more.",
        sectionTitle: "Player Identity",
        sectionDescription: "Add the technical details teammates use to understand your strengths quickly.",
        required: true,
        options: [
          {
            value: "right_foot",
            label: "Right foot",
            description: "You are primarily right-footed.",
          },
          {
            value: "left_foot",
            label: "Left foot",
            description: "You are primarily left-footed.",
          },
          {
            value: "both_feet",
            label: "Both feet",
            description: "You can play confidently with either foot.",
          },
        ],
      },
      {
        key: "playing_style",
        label: "Playing Style",
        description: "Pick the playing identity that fits you best.",
        sectionTitle: "Player Identity",
        sectionDescription: "Add the technical details teammates use to understand your strengths quickly.",
        required: true,
        options: [
          {
            value: "playmaker",
            label: "Playmaker",
            description: "You dictate tempo and create passing lanes.",
          },
          {
            value: "ball_winner",
            label: "Ball winner",
            description: "You press hard and recover possession consistently.",
          },
          {
            value: "dribbler",
            label: "Dribbler",
            description: "You beat defenders and drive attacks forward.",
          },
          {
            value: "finisher",
            label: "Finisher",
            description: "You thrive around the goal and close out chances.",
          },
          {
            value: "versatile",
            label: "Versatile",
            description: "You can adapt your game to the needs of the team.",
          },
        ],
      },
    ],
  },
  3: {
    sportId: 3,
    heading: "Badminton athlete profile",
    intro:
      "Badminton profiles usually describe the discipline you specialize in, your handedness, and the style you bring to rallies and doubles rotations.",
    fields: [
      {
        key: "primary_role",
        label: "Primary Discipline",
        description: "Select the format that best represents your game.",
        sectionTitle: "Discipline Selection",
        sectionDescription: "Start with the badminton discipline that best matches how you usually play.",
        required: true,
        primary: true,
        options: [
          {
            value: "singles_specialist",
            label: "Singles specialist",
            description: "You primarily compete in singles matches.",
          },
          {
            value: "doubles_specialist",
            label: "Doubles specialist",
            description: "You focus on doubles partnerships and rotation.",
          },
          {
            value: "mixed_doubles_specialist",
            label: "Mixed doubles specialist",
            description: "You are strongest in mixed doubles play.",
          },
          {
            value: "multi_discipline",
            label: "Multi-discipline player",
            description: "You are comfortable across more than one discipline.",
          },
        ],
      },
      {
        key: "handedness",
        label: "Handedness",
        description: "Choose the racket hand you naturally play with.",
        sectionTitle: "Player Identity",
        sectionDescription: "Capture the details partners and captains use to understand your style.",
        required: true,
        options: [
          {
            value: "right_handed",
            label: "Right-handed",
            description: "You play primarily with your right hand.",
          },
          {
            value: "left_handed",
            label: "Left-handed",
            description: "You play primarily with your left hand.",
          },
          {
            value: "ambidextrous",
            label: "Ambidextrous",
            description: "You can switch comfortably when needed.",
          },
        ],
      },
      {
        key: "playing_style",
        label: "Playing Style",
        description: "Describe how you usually construct points and rallies.",
        sectionTitle: "Player Identity",
        sectionDescription: "Capture the details partners and captains use to understand your style.",
        required: true,
        options: [
          {
            value: "attacking",
            label: "Attacking",
            description: "You like steep smashes, pressure, and quick initiative.",
          },
          {
            value: "defensive",
            label: "Defensive",
            description: "You absorb pressure and extend rallies patiently.",
          },
          {
            value: "counter_attacking",
            label: "Counter-attacking",
            description: "You turn defense into attack with pace and timing.",
          },
          {
            value: "control",
            label: "Control",
            description: "You rely on placement, rhythm, and consistency.",
          },
          {
            value: "all_round",
            label: "All-round",
            description: "You adapt between attack and control depending on the rally.",
          },
        ],
      },
      {
        key: "court_preference",
        label: "Court Preference",
        description: "Useful especially for doubles and mixed doubles pairings.",
        sectionTitle: "Partnership Setup",
        sectionDescription: "Show where you are most comfortable when building a doubles partnership.",
        required: true,
        visibleWhen: [
          {
            fieldKey: "primary_role",
            values: ["doubles_specialist", "mixed_doubles_specialist", "multi_discipline"],
          },
        ],
        options: [
          {
            value: "front_court",
            label: "Front court",
            description: "You are strongest around the net and quick interceptions.",
          },
          {
            value: "back_court",
            label: "Back court",
            description: "You prefer rear-court coverage, clears, and smashes.",
          },
          {
            value: "rotational",
            label: "Rotational",
            description: "You are comfortable rotating between front and back court.",
          },
        ],
      },
    ],
  },
};

const OPTION_LABEL_BY_VALUE = Object.values(SPORT_PROFILE_CONFIG)
  .flatMap((config) => config.fields)
  .flatMap((field) => field.options)
  .reduce<Record<string, string>>((map, option) => {
    map[option.value] = option.label;
    return map;
  }, {});

export function parseRegistrationNumber(regNo?: string | null): RegistrationMeta {
  const normalizedRegNo = regNo?.trim().toUpperCase().replace(/\s+/g, "") || null;

  if (!normalizedRegNo) {
    return {
      normalizedRegNo: null,
      registrationYear: null,
      courseCode: null,
    };
  }

  const match = normalizedRegNo.match(/^(\d{2})([A-Z]+)(\d+)$/);

  if (!match) {
    return {
      normalizedRegNo,
      registrationYear: null,
      courseCode: null,
    };
  }

  return {
    normalizedRegNo,
    registrationYear: Number(match[1]),
    courseCode: match[2],
  };
}

export function normalizeSportProfile(value: unknown): SportProfileRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value as Record<string, unknown>).reduce<SportProfileRecord>((profile, [key, entryValue]) => {
    if (typeof entryValue === "string" && entryValue.trim()) {
      profile[key] = entryValue;
    }
    return profile;
  }, {});
}

export function getSportProfileConfig(sportId?: number | null): SportProfileConfig | null {
  if (!sportId) return null;
  return SPORT_PROFILE_CONFIG[sportId] || null;
}

function resolveFieldValue(
  config: SportProfileConfig | null,
  sportProfile: SportProfileRecord,
  fieldKey: string,
  preferredRole?: string | null
): string {
  if (sportProfile[fieldKey]) return sportProfile[fieldKey];

  const primaryField = config?.fields.find((field) => field.primary);
  if (primaryField?.key === fieldKey) {
    return preferredRole || "";
  }

  return "";
}

export function isSportProfileFieldVisible(
  field: SportProfileField,
  sportId?: number | null,
  sportProfile: SportProfileRecord = {},
  preferredRole?: string | null
): boolean {
  if (!field.visibleWhen || field.visibleWhen.length === 0) {
    return true;
  }

  const config = getSportProfileConfig(sportId);

  return field.visibleWhen.every((rule) => {
    const currentValue = resolveFieldValue(config, sportProfile, rule.fieldKey, preferredRole);
    return rule.values.includes(currentValue);
  });
}

export function getVisibleSportProfileFields(
  sportId?: number | null,
  sportProfile: SportProfileRecord = {},
  preferredRole?: string | null
): SportProfileField[] {
  const config = getSportProfileConfig(sportId);
  if (!config) return [];

  return config.fields.filter((field) => isSportProfileFieldVisible(field, sportId, sportProfile, preferredRole));
}

export function sanitizeSportProfile(
  sportId?: number | null,
  sportProfile: SportProfileRecord = {},
  preferredRole?: string | null
): SportProfileRecord {
  const visibleFields = getVisibleSportProfileFields(sportId, sportProfile, preferredRole);
  const visibleFieldMap = new Map(visibleFields.map((field) => [field.key, field]));

  return Object.entries(sportProfile).reduce<SportProfileRecord>((nextProfile, [fieldKey, value]) => {
    const field = visibleFieldMap.get(fieldKey);
    if (!field) return nextProfile;
    if (!field.options.some((option) => option.value === value)) return nextProfile;

    nextProfile[fieldKey] = value;
    return nextProfile;
  }, {});
}

export function buildPreferredRole(sportId?: number | null, sportProfile: SportProfileRecord = {}): string {
  const config = getSportProfileConfig(sportId);
  const primaryField = config?.fields.find((field) => field.primary);
  return primaryField ? sportProfile[primaryField.key] || "" : "";
}

export function seedSportProfileFromRole(
  sportId?: number | null,
  preferredRole?: string | null,
  currentProfile: SportProfileRecord = {}
): SportProfileRecord {
  const config = getSportProfileConfig(sportId);
  const primaryField = config?.fields.find((field) => field.primary);

  if (!config || !primaryField || !preferredRole || currentProfile[primaryField.key]) {
    return currentProfile;
  }

  return {
    ...currentProfile,
    [primaryField.key]: preferredRole,
  };
}

export function formatRoleLabel(value?: string | null): string {
  if (!value) return "";
  return OPTION_LABEL_BY_VALUE[value] || humanizeToken(value);
}

export function getSportProfileSummaryItems(
  sportId?: number | null,
  sportProfile: SportProfileRecord = {},
  preferredRole?: string | null
): Array<{ label: string; value: string }> {
  return getVisibleSportProfileFields(sportId, sportProfile, preferredRole)
    .map((field) => {
      const rawValue = resolveFieldValue(getSportProfileConfig(sportId), sportProfile, field.key, preferredRole);
      if (!rawValue) return null;

      return {
        label: field.label,
        value: formatRoleLabel(rawValue),
      };
    })
    .filter((item): item is { label: string; value: string } => !!item);
}

export function getSportProfileSummary(
  sportId?: number | null,
  sportProfile: SportProfileRecord = {},
  preferredRole?: string | null
): string {
  return getSportProfileSummaryItems(sportId, sportProfile, preferredRole)
    .map((item) => `${item.label}: ${item.value}`)
    .join(" • ");
}

export function getSportProfileTeaser(
  sportId?: number | null,
  sportProfile: SportProfileRecord = {},
  preferredRole?: string | null,
  limit = 3
): string {
  const items = getSportProfileSummaryItems(sportId, sportProfile, preferredRole);
  return items
    .slice(0, limit)
    .map((item) => item.value)
    .join(" • ");
}

function humanizeToken(value: string): string {
  return value
    .split("_")
    .map((part) => {
      if (!part) return part;
      if (part.length <= 3) return part.toUpperCase();
      return part[0].toUpperCase() + part.slice(1);
    })
    .join(" ");
}
