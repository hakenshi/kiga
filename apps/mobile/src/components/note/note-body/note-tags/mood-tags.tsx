import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { resolveMoodConfig } from "@/lib/mood-utils";
import { useNote } from "../../note-context";
import type { Props } from "./default-props";

export default function MoodTags({ size = "sm" }: Props) {
  const { note } = useNote();
  const mood = resolveMoodConfig(note);

  if (!mood) return null;

  return (
    <Badge
      size={size}
      rounding="full"
      style={{ backgroundColor: mood.bg, borderColor: mood.border }}
    >
      <BadgeIcon as={mood.Icon} color={mood.color} />
      <BadgeText className="font-medium" style={{ color: mood.color }}>
        {mood.label}
      </BadgeText>
    </Badge>
  );
}
