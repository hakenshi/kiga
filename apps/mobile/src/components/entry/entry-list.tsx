import { useAuthStore } from "@/stores/auth-store";
import { useEntryStore } from "@/stores/journal-store";
import { FlatList, View, ActivityIndicator, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import EntryBody from "./entry-body";
import EntryBottom from "./entry-bottom";
import EntryHeader from "./entry-header";
import EntryShell from "./entry-shell";
import { VStack } from "@/components/ui/vstack";
import { Sparkles } from "lucide-react-native";

function EmptyList() {
  return (
    <VStack className="py-24 items-center justify-center px-6 gap-3">
      <View className="w-14 h-14 rounded-full bg-zinc-100 items-center justify-center">
        <Sparkles size={24} color="#71717A" />
      </View>
      <Text className="text-[15px] font-heading text-zinc-900 text-center">
        Seu diário está em branco
      </Text>
      <Text className="text-xs font-subtitle text-zinc-500 text-center max-w-[260px]">
        Registre como você está se sentindo ou um pensamento que passou pela sua cabeça.
      </Text>
    </VStack>
  );
}

interface Props {
  entries: JournalEntryWithRelations[];
}

export default function EntryList({ entries }: Props) {
  const loadMore = useEntryStore((s) => s.loadMore);
  const hasMore = useEntryStore((s) => s.hasMore);
  const isLoading = useEntryStore((s) => s.isLoading);
  const user = useAuthStore((s) => s.user);
  const { top, bottom } = useSafeAreaInsets();

  return (
    <FlatList
      ListEmptyComponent={<EmptyList />}
      data={entries}
      keyExtractor={(e) => String(e.id)}
      contentContainerStyle={{ paddingTop: top, paddingBottom: bottom + 88 }}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      initialNumToRender={20}
      maxToRenderPerBatch={20}
      windowSize={5}
      onEndReached={() => {
        if (user?.id && hasMore && !isLoading) {
          loadMore(user.id);
        }
      }}
      onEndReachedThreshold={0.4}
      ListFooterComponent={
        isLoading && entries.length > 0 ? (
          <View className="py-4 items-center justify-center">
            <ActivityIndicator size="small" />
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <EntryShell entry={item} entryId={item.id}>
          <EntryHeader fixed={item.fixed} entry={item} liked={item.liked} entryId={item.id} />
          <EntryBody entry={item} />
          <EntryBottom entry={item} entryId={item.id} liked={item.liked} />
        </EntryShell>
      )}
    />
  );
}
