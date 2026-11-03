import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { countWords } from "@/lib/utils";
import { useEntryStore } from "@/stores/journal-store";
import { HeartIcon, MessageCircle, RefreshCcw } from "lucide-react-native";
import { Pressable } from "react-native";

interface Props {
  entry?: JournalEntryWithRelations;
  entryId: number;
  liked: boolean;
}

export default function EntryBottom({ entry, entryId, liked }: Props) {
  const updateEntry = useEntryStore((s) => s.updateEntry);

  const likeEntry = () => {
    updateEntry(entryId, { liked: !liked });
  };

  const wordCount = entry?.content ? countWords(entry.content) : 0;
  const totalTags =
    (entry?.entryEmotions?.length ?? 0) +
    (entry?.entryThoughts?.length ?? 0) +
    (entry?.entryReactions?.length ?? 0) +
    (entry?.entryBehaviors?.length ?? 0);

  return (
    <HStack className="justify-between items-center pt-1">
      <HStack space="lg" className="items-center">
        <Pressable
          hitSlop={8}
          className="flex-row items-center gap-1.5 py-1 active:opacity-60"
        >
          <MessageCircle size={16} color="#68707C" />
        </Pressable>
        <Pressable
          hitSlop={8}
          className="flex-row items-center gap-1.5 py-1 active:opacity-60"
        >
          <RefreshCcw size={16} color="#68707C" />
        </Pressable>
        <Pressable
          hitSlop={8}
          onPress={likeEntry}
          className="flex-row items-center gap-1.5 py-1 active:opacity-60"
        >
          <HeartIcon
            fill={liked ? "#EF4444" : "none"}
            strokeWidth={liked ? 0 : 2}
            size={16}
            color={liked ? "#EF4444" : "#68707C"}
          />
        </Pressable>
      </HStack>

      <HStack className="items-center gap-1.5">
        {totalTags > 0 && (
          <>
            <Text className="text-[11px] font-subtitle text-[#8E95A2]">
              {totalTags} {totalTags === 1 ? "registro TCC" : "registros TCC"}
            </Text>
            <Text className="text-[11px] font-subtitle text-[#C4C9D4]">·</Text>
          </>
        )}
        <Text className="text-[11px] font-subtitle text-[#8E95A2]">
          {wordCount} {wordCount === 1 ? "palavra" : "palavras"}
        </Text>
      </HStack>
    </HStack>
  );
}
