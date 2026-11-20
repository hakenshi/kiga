import { Badge, BadgeGroup, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Drama } from "lucide-react-native";
import { useState } from "react";
import { useNote } from "../../note-context";
import type { Props } from "./default-props";

interface SummaryProps extends Props {
  count: number;
  onExpand: () => void;
}

interface ExpandedProps extends Props {
  emotions: Note["noteEmotions"];
  onCollapse: () => void;
}

function Summary({ size, count, onExpand }: SummaryProps) {
  return (
    <Badge variant="emotion" size={size} rounding="full" onPress={onExpand}>
      <BadgeIcon as={Drama} />
      <BadgeText className="font-heading">
        {`${count} ${count === 1 ? "emoção" : "emoções"}`}
      </BadgeText>
      <BadgeIcon as={ChevronDown} />
    </Badge>
  );
}

function Expanded({ size, emotions, onCollapse }: ExpandedProps) {
  return (
    <BadgeGroup wrap className="max-w-full">
      {emotions.map(({ emotion }) => (
        <Badge key={emotion.id} variant="emotion" size={size}>
          <BadgeIcon as={Drama} />
          <BadgeText className="font-medium">{emotion.name}</BadgeText>
        </Badge>
      ))}
      <Badge variant="muted" size={size} rounding="full" onPress={onCollapse}>
        <BadgeIcon as={ChevronUp} />
        <BadgeText>Recolher emoções</BadgeText>
      </Badge>
    </BadgeGroup>
  );
}

export default function EmotionTags({ size = "sm" }: Props) {
  const [expandedTags, setExpandedTags] = useState(false);
  const { note: { noteEmotions: emotions } } = useNote()

  if (emotions.length === 0) return null;
  if (!expandedTags) {
    return <Summary size={size} count={emotions.length} onExpand={() => setExpandedTags(true)} />;
  }
  return <Expanded size={size} emotions={emotions} onCollapse={() => setExpandedTags(false)} />;
}
