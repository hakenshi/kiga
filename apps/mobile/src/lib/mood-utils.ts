import { Angry, Frown, Laugh, Meh, Smile, type LucideIcon } from "lucide-react-native";

export interface MoodStyleConfig {
  label: string;
  Icon: LucideIcon;
  bg: string;
  border: string;
  color: string;
}

export const MOOD_BY_ID: Record<number, MoodStyleConfig> = {
  1: {
    label: "Muito Mal",
    Icon: Angry,
    bg: "#FEF2F2",
    border: "#FECACA",
    color: "#B91C1C",
  },
  2: {
    label: "Mal",
    Icon: Frown,
    bg: "#FFF7ED",
    border: "#FED7AA",
    color: "#C2410C",
  },
  3: {
    label: "Neutro",
    Icon: Meh,
    bg: "#F4F4F5",
    border: "#E4E4E7",
    color: "#52525B",
  },
  4: {
    label: "Bem",
    Icon: Smile,
    bg: "#F0FDF4",
    border: "#BBF7D0",
    color: "#15803D",
  },
  5: {
    label: "Muito Bem",
    Icon: Laugh,
    bg: "#ECFDF5",
    border: "#A7F3D0",
    color: "#047857",
  },
};

export function resolveMoodConfig(entry?: {
  moodId?: number | null;
  mood?: { id?: number; name?: string } | null;
}): MoodStyleConfig | null {
  const moodId = entry?.moodId ?? entry?.mood?.id;
  const moodName = entry?.mood?.name?.trim();

  if (moodId && MOOD_BY_ID[moodId]) {
    const base = MOOD_BY_ID[moodId];
    return {
      ...base,
      label: moodName || base.label,
    };
  }

  if (moodName) {
    const lower = moodName.toLowerCase();
    if (lower.includes("muito mal")) return { ...MOOD_BY_ID[1], label: moodName };
    if (lower.includes("mal")) return { ...MOOD_BY_ID[2], label: moodName };
    if (lower.includes("muito bem")) return { ...MOOD_BY_ID[5], label: moodName };
    if (lower.includes("bem")) return { ...MOOD_BY_ID[4], label: moodName };
    return { ...MOOD_BY_ID[3], label: moodName };
  }

  return null;
}
