import { useRouter } from "expo-router";
import { PropsWithChildren } from "react";
import { Pressable } from "react-native";

interface Props extends PropsWithChildren {
  entryId?: number;
  entry?: JournalEntryWithRelations;
}

export default function EntryShell({ children, entry, entryId }: Props) {
  const router = useRouter();
  const id = entry?.id ?? entryId;
  const isPureRepost = entry?.entryType === "repost" && !entry?.content?.trim();
  const parentId =
    entry?.parentRepost?.parentEntryId || entry?.parentReply?.parentEntryId;
  const targetId = isPureRepost && parentId ? parentId : id;

  const handlePress = () => {
    if (targetId) {
      router.push(`/(home)/home/view-post/${targetId}`);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      className="border-b border-[#E6E8EC] px-4 py-4 bg-white gap-2.5 active:bg-zinc-50/70"
    >
      {children}
    </Pressable>
  );
}
