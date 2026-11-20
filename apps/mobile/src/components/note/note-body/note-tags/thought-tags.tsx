import { Badge, BadgeGroup, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { Brain, ChevronDown, ChevronUp } from "lucide-react-native";
import { useState } from "react";
import { useNote } from "../../note-context";
import type { Props } from "./default-props";

interface SummaryProps extends Props {
  count: number;
  onExpand: () => void;
}

interface ExpandedProps extends Props {
  thoughts: Note["noteThoughts"];
  onCollapse: () => void;
}

function Summary({ size, count, onExpand }: SummaryProps) {
  return (
    <Badge variant="thought" size={size} rounding="full" onPress={onExpand}>
      <BadgeIcon as={Brain} />
      <BadgeText className="font-heading">
        {`${count} pensamento${count === 1 ? "" : "s"}`}
      </BadgeText>
      <BadgeIcon as={ChevronDown} />
    </Badge>
  );
}

function Expanded({ size, thoughts, onCollapse }: ExpandedProps) {
  return (
    <BadgeGroup wrap className="max-w-full">
      {thoughts.map(({ thought }) => (
        <Badge key={thought.id} variant="thought" size={size} className="max-w-full">
          <BadgeIcon as={Brain} />
          <BadgeText className="font-medium">“{thought.name}”</BadgeText>
        </Badge>
      ))}
      <Badge variant="muted" size={size} rounding="full" onPress={onCollapse}>
        <BadgeIcon as={ChevronUp} />
        <BadgeText>Recolher pensamentos</BadgeText>
      </Badge>
    </BadgeGroup>
  );
}

export default function ThoughtTags({ size = "sm" }: Props) {
  const [expandedTags, setExpandedTags] = useState(false);

  const { note: { noteThoughts: thoughts } } = useNote()

  if (thoughts.length === 0) return null;
  if (!expandedTags) {
    return <Summary size={size} count={thoughts.length} onExpand={() => setExpandedTags(true)} />;
  }
  return <Expanded size={size} thoughts={thoughts} onCollapse={() => setExpandedTags(false)} />;
}
