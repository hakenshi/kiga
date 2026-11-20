import { Badge, BadgeGroup, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { getBehaviorIcon } from "@/lib/behavior-icons";
import { ChevronDown, ChevronUp, Footprints } from "lucide-react-native";
import { useState } from "react";
import { useNote } from "../../note-context";
import type { Props } from "./default-props";

interface SummaryProps extends Props {
  count: number;
  onExpand: () => void;
}

interface ExpandedProps extends Props {
  behaviors: Behavior[];
  onCollapse: () => void;
}

function Summary({ size, count, onExpand }: SummaryProps) {
  return (
    <Badge variant="behavior" size={size} rounding="full" onPress={onExpand}>
      <BadgeIcon as={Footprints} />
      <BadgeText className="font-heading">
        {`${count} ${count === 1 ? "ação" : "ações"}`}
      </BadgeText>
      <BadgeIcon as={ChevronDown} />
    </Badge>
  );
}

function Expanded({ size, behaviors, onCollapse }: ExpandedProps) {
  return (
    <BadgeGroup wrap className="max-w-full">
      {behaviors.map(behavior => (
        <Badge key={behavior.id} variant="behavior" size={size}>
          <BadgeIcon as={getBehaviorIcon(behavior.icon)} />
          <BadgeText className="font-medium">{behavior.content}</BadgeText>
        </Badge>
      ))}
      <Badge variant="muted" size={size} rounding="full" onPress={onCollapse}>
        <BadgeIcon as={ChevronUp} />
        <BadgeText>Recolher ações</BadgeText>
      </Badge>
    </BadgeGroup>
  );
}

export default function BehaviorTags({ size = "sm" }: Props) {
  const [expandedTags, setExpandedTags] = useState(false)

  const { note: { noteBehaviors } } = useNote()

  const behaviors = noteBehaviors.map(b => b.behavior)

  if (behaviors.length === 0) return null;
  if (!expandedTags) {
    return <Summary size={size} count={behaviors.length} onExpand={() => setExpandedTags(true)} />;
  }
  return <Expanded size={size} behaviors={behaviors} onCollapse={() => setExpandedTags(false)} />;
}
