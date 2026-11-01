import { HStack } from "@/components/ui/hstack";
import { useEntryStore } from "@/stores/journal-store";
import { HeartIcon, MessageCircle, RefreshCcw } from "lucide-react-native";
import { Pressable } from "react-native";

interface Props {
  entryId: number;
  liked: boolean;
}

export default function EntryBottom({ entryId, liked }: Props) {
  const updateEntry = useEntryStore((s) => s.updateEntry);

  const likeEntry = () => {
    updateEntry(entryId, { liked: !liked });
  };

  return (
    <HStack space="md" className="p-3">
      <Pressable>
        <MessageCircle size={16} />
      </Pressable>
      <Pressable>
        <RefreshCcw size={16} />
      </Pressable>
      <Pressable onPress={likeEntry}>
        <HeartIcon
          fill={liked ? "black" : "none"}
          strokeWidth={liked ? 0 : 2}
          size={16}
        />
      </Pressable>
    </HStack>
  );
}
