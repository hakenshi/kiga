import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { useEntryStore } from "@/stores/journal-store";
import { Link } from "expo-router";
import { CornerDownRightIcon, HeartIcon, RefreshCcw } from "lucide-react-native";
import { useState } from "react";
import { Pressable } from "react-native";
import { RepostDrawer } from "./repost-drawer";

interface Props {
  entry?: JournalEntryWithRelations;
  entryId: number;
  liked: boolean;
}

export default function EntryBottom({ entry, entryId, liked }: Props) {
  const updateEntry = useEntryStore((s) => s.updateEntry);
  const [repostOpen, setRepostOpen] = useState(false);

  const isPureRepost = entry?.entryType === "repost" && !entry?.content?.trim();
  const parentEntry = (entry?.parentRepost as any)?.parentEntry || (entry?.parentReply as any)?.parentEntry;
  const targetId = isPureRepost && parentEntry ? parentEntry.id : entryId;

  const likeEntry = () => {
    updateEntry(entryId, { liked: !liked });
  };

  return (
    <>
      <HStack className="justify-between items-center pt-1">
        <HStack space="md" className="items-center">
          <Link asChild href={`/(home)/home/reply-post/${targetId}`}>
            <Pressable
              hitSlop={8}
              className="flex-row items-center bg-zinc-100 py-2 px-4 rounded-full gap-1.5 active:opacity-60"
            >
              <CornerDownRightIcon size={12} color="black" />
              <Text className="text-xs text-black font-semibold">
                Continuar
              </Text>
            </Pressable>
          </Link>

          <Pressable
            hitSlop={8}
            onPress={() => setRepostOpen(true)}
            className="flex-row items-center bg-zinc-100 py-2 px-4 rounded-full gap-1.5 active:opacity-60"
          >
            <RefreshCcw size={12} color="black" />
            <Text className="text-xs text-black font-semibold">
              Revisitar
            </Text>
          </Pressable>

          <Pressable
            hitSlop={8}
            onPress={likeEntry}
            className="flex-row items-center bg-zinc-100 py-2 px-4 rounded-full gap-1.5 active:opacity-60"
          >
            <HeartIcon
              fill={liked ? "#EF4444" : "none"}
              strokeWidth={liked ? 0 : 2}
              size={12}
              color={liked ? "#EF4444" : "#68707C"}
            />
            <Text className="text-xs text-black font-semibold">
              {liked ? "Remover" : "Guardar"}
            </Text>
          </Pressable>
        </HStack>
      </HStack>

      <RepostDrawer
        isOpen={repostOpen}
        onClose={() => setRepostOpen(false)}
        entry={entry ?? ({ id: entryId } as any)}
      />
    </>
  );
}
