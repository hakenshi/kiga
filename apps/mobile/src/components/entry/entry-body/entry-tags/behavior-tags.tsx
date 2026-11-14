import { Badge, BadgeGroup, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { getBehaviorIcon } from "@/lib/behavior-icons";
import { ChevronDown, ChevronUp, Footprints } from "lucide-react-native";
import { useState } from "react";

interface Props {
  behaviors: Behavior[];
}

function Summary({ count, onExpand }: { count: number; onExpand: () => void }) {
  return (
    <Badge variant="behavior" size="md" rounding="full" onPress={onExpand}>
      <BadgeIcon as={Footprints} />
      <BadgeText className="font-heading">
        {`${count} ${count === 1 ? "ação" : "ações"}`}
      </BadgeText>
      <BadgeIcon as={ChevronDown} />
    </Badge>
  );
}

function Expanded({ behaviors, onCollapse }: Props & { onCollapse: () => void }) {
  return (
    <BadgeGroup wrap className="max-w-full">
      {behaviors.map(behavior => (
        <Badge key={behavior.id} variant="behavior">
          <BadgeIcon as={getBehaviorIcon(behavior.icon)} />
          <BadgeText className="font-medium">{behavior.content}</BadgeText>
        </Badge>
      ))}
      <Badge variant="muted" size="xs" rounding="full" onPress={onCollapse}>
        <BadgeIcon as={ChevronUp} />
        <BadgeText>Recolher ações</BadgeText>
      </Badge>
    </BadgeGroup>
  );
}

export default function BehaviorTags({ behaviors }: Props) {
  const [expandedTags, setExpandedTags] = useState(false);

  if (behaviors.length === 0) return null;
  if (!expandedTags) {
    return <Summary count={behaviors.length} onExpand={() => setExpandedTags(true)} />;
  }
  return <Expanded behaviors={behaviors} onCollapse={() => setExpandedTags(false)} />;
}
