import { Badge, BadgeGroup, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { Brain, ChevronDown, ChevronUp } from "lucide-react-native";
import { useState } from "react";

interface Props {
  thoughts: Note["noteThoughts"];
}

function Summary({ count, onExpand }: { count: number; onExpand: () => void }) {
  return (
    <Badge variant="thought" size="md" rounding="full" onPress={onExpand}>
      <BadgeIcon as={Brain} />
      <BadgeText className="font-heading">
        {`${count} pensamento${count === 1 ? "" : "s"}`}
      </BadgeText>
      <BadgeIcon as={ChevronDown} />
    </Badge>
  );
}

function Expanded({ thoughts, onCollapse }: Props & { onCollapse: () => void }) {
  return (
    <BadgeGroup wrap className="max-w-full">
      {thoughts.map(({ thought }) => (
        <Badge key={thought.id} variant="thought" className="max-w-full">
          <BadgeIcon as={Brain} />
          <BadgeText className="font-medium">“{thought.name}”</BadgeText>
        </Badge>
      ))}
      <Badge variant="muted" size="xs" rounding="full" onPress={onCollapse}>
        <BadgeIcon as={ChevronUp} />
        <BadgeText>Recolher pensamentos</BadgeText>
      </Badge>
    </BadgeGroup>
  );
}

export default function ThoughtTags({ thoughts }: Props) {
  const [expandedTags, setExpandedTags] = useState(false);

  if (thoughts.length === 0) return null;
  if (!expandedTags) {
    return <Summary count={thoughts.length} onExpand={() => setExpandedTags(true)} />;
  }
  return <Expanded thoughts={thoughts} onCollapse={() => setExpandedTags(false)} />;
}
