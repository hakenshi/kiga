import { Badge, BadgeGroup, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { Activity, ChevronDown, ChevronUp } from "lucide-react-native";
import { useState } from "react";
import { useNote } from "../../note-context";
import type { Props } from "./default-props";

interface SummaryProps extends Props {
  count: number;
  onExpand: () => void;
}

interface ExpandedProps extends Props {
  reactions: Note["noteReactions"];
  onCollapse: () => void;
}

function Summary({ size, count, onExpand }: SummaryProps) {
  return (
    <Badge variant="reaction" size={size} rounding="full" onPress={onExpand}>
      <BadgeIcon as={Activity} />
      <BadgeText className="font-heading">
        {`${count} ${count === 1 ? "reação" : "reações"}`}
      </BadgeText>
      <BadgeIcon as={ChevronDown} />
    </Badge>
  );
}

function Expanded({ size, reactions, onCollapse }: ExpandedProps) {
  return (
    <BadgeGroup wrap className="max-w-full">
      {reactions.map(({ reaction }) => (
        <Badge key={reaction.id} variant="reaction" size={size}>
          <BadgeIcon as={Activity} />
          <BadgeText className="font-medium">{reaction.name}</BadgeText>
        </Badge>
      ))}
      <Badge variant="muted" size={size} rounding="full" onPress={onCollapse}>
        <BadgeIcon as={ChevronUp} />
        <BadgeText>Recolher reações</BadgeText>
      </Badge>
    </BadgeGroup>
  );
}

export default function ReactionTags({ size = "sm" }: Props) {
  const [expandedTags, setExpandedTags] = useState(false);

  const { note: { noteReactions: reactions } } = useNote()

  if (reactions.length === 0) return null;
  if (!expandedTags) {
    return <Summary size={size} count={reactions.length} onExpand={() => setExpandedTags(true)} />;
  }
  return <Expanded size={size} reactions={reactions} onCollapse={() => setExpandedTags(false)} />;
}
