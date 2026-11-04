import { FlatList } from "react-native-gesture-handler";
import EntryBody from "./_components/entry/entry-body";
import EntryBottom from "./_components/entry/entry-bottom";
import EntryHeader from "./_components/entry/entry-header";
import EntryShell from "./_components/entry/entry-shell";
import { useEntryStore } from "@/stores/journal-store";
import { useAuthStore } from "@/stores/auth-store";
import { useEffect } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { Link } from "expo-router";
import { FaceSlightlySmilingPlus, PlusIcon } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";

function EmptyList() {
  return (
    <VStack className="h-200 flex-1 items-center justify-center" space="xl">
      <Text>
        Parece que você não tem nenhum pensamento ainda.
      </Text>
    </VStack>
  )
}

export default function HomePage() {
  const { entries, loadInitial, loadMore, hasMore, isLoading } = useEntryStore();
  const { user } = useAuthStore();
  const { top, bottom } = useSafeAreaInsets();

  useEffect(() => {
    if (user?.id && entries.length === 0) {
      loadInitial(user.id);
    }
  }, [user?.id, entries.length, loadInitial]);

  return (
    <View className="flex-1 bg-zinc-50">
      <FlatList
        ListEmptyComponent={<EmptyList />}
        data={entries}
        keyExtractor={(e) => String(e.id)}
        contentContainerStyle={{ paddingTop: top, paddingBottom: bottom }}
        showsHorizontalScrollIndicator={false}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={5}
        showsVerticalScrollIndicator={false}
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
          <EntryShell entryId={item.id}>
            <EntryHeader fixed={item.fixed} entry={item} liked={item.liked} entryId={item.id} />
            <EntryBody entry={item} />
            <EntryBottom entry={item} entryId={item.id} liked={item.liked} />
          </EntryShell>
        )}
      />

      <Link href="/(home)/home/new-post" asChild>
        <Pressable
          className="absolute right-5 bottom-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg active:scale-95"
          style={{
            elevation: 6,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 4.65,
          }}
        >
          <PlusIcon size={24} color="#fafafa" strokeWidth={2.5} />
        </Pressable>
      </Link>
    </View>
  );
}
