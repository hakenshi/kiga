import { useAuthStore } from "@/stores/auth-store";
import { getNoteBody, useNoteStore } from "@/stores/note-store";
import { FlatList, View, ActivityIndicator, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NoteBodyShell from "./note-body";
import Content from "./note-body/content";
import { BehaviorReportBlock } from "./note-body/behavior-report-block";
import NoteTagsShell from "./note-body/note-tags";
import BehaviorTags from "./note-body/note-tags/behavior-tags";
import EmotionTags from "./note-body/note-tags/emotion-tags";
import ReactionTags from "./note-body/note-tags/reaction-tags";
import ThoughtTags from "./note-body/note-tags/thought-tags";
import NoteFooterShell from "./note-footer";
import ContinueButton from "./note-footer/continue-button";
import KeepButton from "./note-footer/keep-button";
import NoteHeader from "./note-header";
import Actions from "./note-header/actions";
import Author from "./note-header/author";
import Fixed from "./note-header/fixed";
import Repost from "./note-header/repost";
import NoteLinkShell from "./note-link-shell";
import { RepostDrawer } from "./repost-drawer";
import { ImageCarousel } from "@/components/image-carousel";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Sparkles } from "lucide-react-native";
import { useRouter } from "expo-router";

function EmptyList() {
  const query = useNoteStore(s => s.query);

  return (
    <VStack className="py-24 items-center justify-center px-6 gap-3">
      <View className="w-14 h-14 rounded-full bg-zinc-100 items-center justify-center">
        <Sparkles size={24} color="#71717A" />
      </View>
      <Text className="text-base font-heading text-zinc-900 text-center">
        {query === "" ? "Seu diário está em branco" : "Nenhuma nota encontrada"}
      </Text>
      <Text className="text-xs font-subtitle text-zinc-500 text-center max-w-65">
        {query === ""
          ? "Registre como você está se sentindo ou um pensamento que passou pela sua cabeça."
          : "Tente buscar por outro texto."}
      </Text>
    </VStack>
  );
}

interface Props {
  notes: Note[];
}

export default function NoteList({ notes }: Props) {
  const loadMore = useNoteStore((s) => s.loadMore);
  const hasMore = useNoteStore((s) => s.hasMore);
  const isLoading = useNoteStore((s) => s.isLoading);
  const userId = useAuthStore((s) => s.user!.id);
  const { top, bottom } = useSafeAreaInsets()

  const router = useRouter()

  return (
    <FlatList
      ListEmptyComponent={<EmptyList />}
      data={notes}
      keyExtractor={(n) => String(n.id)}
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
        isLoading && notes.length > 0 ? (
          <View className="py-4 items-center justify-center">
            <ActivityIndicator size="small" />
          </View>
        ) : null
      }
      renderItem={({ item }) => {
        const { images, reports } = getNoteBody(item);

        return (
          <NoteLinkShell note={item} >
            {item.fixed && <Fixed />}
            {item.isRepost && <Repost />}
            <NoteHeader>
              <Author />
              <Actions />
            </NoteHeader>
            <NoteBodyShell>
              {item.content.length > 0 && <Content />}
              <ImageCarousel images={images} />
              <NoteTagsShell>
                <ThoughtTags />
                <EmotionTags />
                <ReactionTags />
                <BehaviorTags />
              </NoteTagsShell>
              {reports.map(behavior => (
                <BehaviorReportBlock key={behavior.id} text={behavior.content} />
              ))}
            </NoteBodyShell>
            <NoteFooterShell>
              <HStack space="sm">
                <ContinueButton
                  onPress={() => {
                    router.push(`/home/reply-note/${item.id}`)
                  }}
                />
                <RepostDrawer />
                <KeepButton />
              </HStack>
            </NoteFooterShell>
          </NoteLinkShell>
        );
      }}
    />
  );
}
