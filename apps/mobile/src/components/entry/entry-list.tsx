import { useAuthStore } from "@/stores/auth-store";
import { getEntryBody, useEntryStore } from "@/stores/journal-store";
import { FlatList, View, ActivityIndicator, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import EntryBodyShell from "./entry-body";
import Content from "./entry-body/content";
import { BehaviorReportBlock } from "./entry-body/behavior-report-block";
import EntryTagsShell from "./entry-body/entry-tags";
import BehaviorTags from "./entry-body/entry-tags/behavior-tags";
import EmotionTags from "./entry-body/entry-tags/emotion-tags";
import ReactionTags from "./entry-body/entry-tags/reaction-tags";
import ThoughtTags from "./entry-body/entry-tags/thought-tags";
import EntryFooterShell from "./entry-footer";
import ContinueButton from "./entry-footer/continue-button";
import KeepButton from "./entry-footer/keep-button";
import EntryHeader from "./entry-header";
import Actions from "./entry-header/actions";
import Author from "./entry-header/author";
import Fixed from "./entry-header/fixed";
import Repost from "./entry-header/repost";
import EntryLinkShell from "./entry-link-shell";
import { RepostDrawer } from "./repost-drawer";
import { ImageCarousel } from "@/components/image-carousel";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Sparkles } from "lucide-react-native";

function EmptyList() {
  const query = useEntryStore(s => s.query);

  return (
    <VStack className="py-24 items-center justify-center px-6 gap-3">
      <View className="w-14 h-14 rounded-full bg-zinc-100 items-center justify-center">
        <Sparkles size={24} color="#71717A" />
      </View>
      <Text className="text-[15px] font-heading text-zinc-900 text-center">
        {query === "" ? "Seu diário está em branco" : "Nenhum relato encontrado"}
      </Text>
      <Text className="text-xs font-subtitle text-zinc-500 text-center max-w-[260px]">
        {query === ""
          ? "Registre como você está se sentindo ou um pensamento que passou pela sua cabeça."
          : "Tente buscar por outro texto."}
      </Text>
    </VStack>
  );
}

interface Props {
  entries: JournalEntry[];
}

export default function EntryList({ entries }: Props) {
  const loadMore = useEntryStore((s) => s.loadMore);
  const hasMore = useEntryStore((s) => s.hasMore);
  const isLoading = useEntryStore((s) => s.isLoading);
  const userId = useAuthStore((s) => s.user!.id);
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
        if (hasMore && !isLoading) {
          loadMore(userId);
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
      renderItem={({ item }) => {
        const { images, behaviors, reports } = getEntryBody(item);

        return (
          <EntryLinkShell entryId={item.id}>
            {item.fixed && <Fixed />}
            {item.isRepost && <Repost />}
            <EntryHeader>
              <Author />
              <Actions entryId={item.id} liked={item.liked} fixed={item.fixed} />
            </EntryHeader>
            <EntryBodyShell>
              {item.content.length > 0 && <Content content={item.content} />}
              <ImageCarousel images={images} />
              <EntryTagsShell>
                <ThoughtTags thoughts={item.entryThoughts} />
                <EmotionTags emotions={item.entryEmotions} />
                <ReactionTags reactions={item.entryReactions} />
                <BehaviorTags behaviors={behaviors} />
              </EntryTagsShell>
              {reports.map(behavior => (
                <BehaviorReportBlock key={behavior.id} text={behavior.content} />
              ))}
            </EntryBodyShell>
            <EntryFooterShell>
              <HStack space="sm">
                <ContinueButton entryId={item.id} />
                <RepostDrawer entry={item} />
                <KeepButton entryId={item.id} liked={item.liked} />
              </HStack>
            </EntryFooterShell>
          </EntryLinkShell>
        );
      }}
    />
  );
}
