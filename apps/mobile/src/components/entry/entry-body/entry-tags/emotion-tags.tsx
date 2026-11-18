import { Badge, BadgeGroup, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Drama } from "lucide-react-native";
import { useState } from "react";

interface Props {
  emotions: Note["noteEmotions"];
}

function Summary({ count, onExpand }: { count: number; onExpand: () => void }) {
  return (
    <Badge variant="emotion" size="md" rounding="full" onPress={onExpand}>
      <BadgeIcon as={Drama} />
      <BadgeText className="font-heading">
        {`${count} ${count === 1 ? "emoção" : "emoções"}`}
      </BadgeText>
      <BadgeIcon as={ChevronDown} />
    </Badge>
  );
}

function Expanded({ emotions, onCollapse }: Props & { onCollapse: () => void }) {
  return (
    <BadgeGroup wrap className="max-w-full">
      {emotions.map(({ emotion }) => (
        <Badge key={emotion.id} variant="emotion">
          <BadgeIcon as={Drama} />
          <BadgeText className="font-medium">{emotion.name}</BadgeText>
        </Badge>
      ))}
      <Badge variant="muted" size="xs" rounding="full" onPress={onCollapse}>
        <BadgeIcon as={ChevronUp} />
        <BadgeText>Recolher emoções</BadgeText>
      </Badge>
    </BadgeGroup>
  );
}

export default function EmotionTags({ emotions }: Props) {
  const [expandedTags, setExpandedTags] = useState(false);

  if (emotions.length === 0) return null;
  if (!expandedTags) {
    return <Summary count={emotions.length} onExpand={() => setExpandedTags(true)} />;
  }
  return <Expanded emotions={emotions} onCollapse={() => setExpandedTags(false)} />;
}
