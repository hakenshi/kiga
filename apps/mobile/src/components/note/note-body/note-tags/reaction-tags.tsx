import { Badge, BadgeGroup, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { Activity, ChevronDown, ChevronUp } from "lucide-react-native";
import { useState } from "react";
import { useNote } from "../../note-context";

interface Props {
  reactions: Note["noteReactions"];
}

function Summary({ count, onExpand }: { count: number; onExpand: () => void }) {
  return (
    <Badge variant="reaction" size="md" rounding="full" onPress={onExpand}>
      <BadgeIcon as={Activity} />
      <BadgeText className="font-heading">
        {`${count} ${count === 1 ? "reação" : "reações"}`}
      </BadgeText>
      <BadgeIcon as={ChevronDown} />
    </Badge>
  );
}

function Expanded({ reactions, onCollapse }: Props & { onCollapse: () => void }) {
  return (
    <BadgeGroup wrap className="max-w-full">
      {reactions.map(({ reaction }) => (
        <Badge key={reaction.id} variant="reaction">
          <BadgeIcon as={Activity} />
          <BadgeText className="font-medium">{reaction.name}</BadgeText>
        </Badge>
      ))}
      <Badge variant="muted" size="xs" rounding="full" onPress={onCollapse}>
        <BadgeIcon as={ChevronUp} />
        <BadgeText>Recolher reações</BadgeText>
      </Badge>
    </BadgeGroup>
  );
}

export default function ReactionTags() {
  const [expandedTags, setExpandedTags] = useState(false);

  const { note: { noteReactions: reactions } } = useNote()

  if (reactions.length === 0) return null;
  if (!expandedTags) {
    return <Summary count={reactions.length} onExpand={() => setExpandedTags(true)} />;
  }
  return <Expanded reactions={reactions} onCollapse={() => setExpandedTags(false)} />;
}
