import { Text } from "@/components/ui/text";
import Media from "@/components/composer/media";
import { Avatar, AvatarFallbackText } from "@/components/ui/avatar";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { useReplyNoteCacheStore } from "@/stores/reply-note-cache-store";
import { useNoteStore } from "@/stores/note-store";
import { useLocalSearchParams } from "expo-router";
import { CornerDownRight } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, TextInput, View } from "react-native";
//
// function formatParentTime(rawDate?: Date | string | number | null) {
//   if (!rawDate) return "";
//   const d = new Date(rawDate);
//   const now = new Date();
//   const isToday =
//     d.getDate() === now.getDate() &&
//     d.getMonth() === now.getMonth() &&
//     d.getFullYear() === now.getFullYear();
//
//   const timeStr = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
//   if (isToday) return `Hoje · ${timeStr}`;
//
//   const dayMonth = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
//   return `${dayMonth} · ${timeStr}`;
// }
//
export default function ReplyNotePage() {
  const { noteId } = useLocalSearchParams<{ noteId: string }>();
  const findComposerNote = useNoteStore((s) => s.findComposerNote);
  const [context, setContext] = useState<Awaited<ReturnType<typeof findComposerNote>>>(null);
  const [isLoading, setIsLoading] = useState(true);
  const draft = useReplyNoteCacheStore((s) => s.note);
  const update = useReplyNoteCacheStore((s) => s.update);
  const removeImage = useReplyNoteCacheStore((s) => s.removeImage);
  const replaceImage = useReplyNoteCacheStore((s) => s.replaceImage);

  useEffect(() => {
    let active = true;

    findComposerNote(noteId).then((note) => {
      if (active) {
        setContext(note);
        setIsLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [noteId, findComposerNote]);

  // const router = useRouter();
  // const { noteId } = useLocalSearchParams<{ noteId: string }>();
  // const user = useAuthStore((s) => s.user);
  // const addNote = useNoteStore((s) => s.addNote);
  //
  // const [rootNote, setRootNote] = useState<NoteWithRelations | null>(null);
  // const [existingRepliesCount, setExistingRepliesCount] = useState(0);
  // const [isLoadingThread, setIsLoadingThread] = useState(true);
  //
  // useEffect(() => {
  //   if (!noteId) return;
  //   const numId = Number(noteId);
  //   useComposerDraftStore.getState().reset();
  //   setIsLoadingThread(true);
  //   NoteRepository.getThread(numId)
  //     .then((thread) => {
  //       if (thread) {
  //         setRootNote(thread.rootNote);
  //         setExistingRepliesCount(thread.replies.length);
  //       }
  //     })
  //     .finally(() => setIsLoadingThread(false));
  // }, [noteId]);
  //
  // const actions = {
  //   close: () => {
  //     useComposerDraftStore.getState().reset();
  //     if (router.canGoBack()) {
  //       router.back();
  //     } else {
  //       router.push("/(home)/home");
  //     }
  //   },
  //   submit: async () => {
  //     const state = useComposerDraftStore.getState();
  //     if (!state.content.trim()) return;
  //     if (!rootNote) return;
  //
  //     useComposerDraftStore.setState({ isSaving: true });
  //     try {
  //       const newReply = await NoteRepository.createReply({
  //         userId: user!.id,
  //         parentNoteId: rootNote.id,
  //         content: state.content,
  //         moodId: state.moodId,
  //         emotions: state.emotions,
  //         thoughts: state.thoughts,
  //         reactions: state.reactions,
  //         behaviors: state.behaviors,
  //         images: state.images,
  //         date: state.noteDate,
  //       });
  //
  //       addNote(newReply);
  //       state.reset();
  //       useToastStore.getState().showInfo("Reflexão adicionada à linha do tempo.");
  //       if (router.canGoBack()) {
  //         router.back();
  //       } else {
  //         router.push(`/(home)/home/view-note/${rootNote.id}`);
  //       }
  //     } catch (err) {
  //       useToastStore.getState().showError("Falha ao salvar a reflexão.", err);
  //       useComposerDraftStore.setState({ isSaving: false });
  //     }
  //   },
  // };
  //
  // const parentMood = resolveMoodConfig(rootNote ?? undefined);
  // const stepNumber = existingRepliesCount + 1;
  // const parentAuthorName = rootNote?.userId === user?.id
  //   ? `${user?.firstName ?? ""} ${user?.secondName ?? ""}`.trim()
  //   : "Autor da nota";
  //
  // const parentThoughts = (rootNote?.noteThoughts ?? [])
  //   .map((t) => t.thought?.name)
  //   .filter(Boolean);
  // const parentEmotions = (rootNote?.noteEmotions ?? [])
  //   .map((e) => e.emotion?.name)
  //   .filter(Boolean);
  //
  return (
    <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {isLoading ? (
        <View className="py-12 items-center justify-center">
          <ActivityIndicator size="small" color="#18181B" />
        </View>
      ) : context ? (
        <VStack className="px-4 pt-4 pb-2">
          <HStack className="gap-3 items-stretch">
            <VStack className="items-center">
              <Avatar className="w-8 h-8 bg-zinc-100 border border-zinc-200">
                <AvatarFallbackText className="text-zinc-700 text-xs font-semibold">
                  {context.authorInitial}
                </AvatarFallbackText>
              </Avatar>
              <View className="w-0.5 bg-zinc-200 flex-1 my-1" />
            </VStack>

            <VStack className="flex-1 pb-4 gap-2">
              <HStack className="justify-between items-center">
                <HStack className="items-center gap-1.5 flex-wrap">
                  <Text className="text-sm font-subtitle-semibold text-zinc-900">
                    {context.authorName}
                  </Text>
                  <Text className="text-zinc-400 text-xs">·</Text>
                  <Text className="text-xs font-subtitle text-zinc-500">
                    {context.formattedDate}
                  </Text>
                </HStack>

                {context.mood && (
                  <HStack
                    className="items-center px-2 py-0.5 rounded-full border gap-1"
                    style={{ backgroundColor: context.mood.bg, borderColor: context.mood.border }}
                  >
                    <context.mood.Icon size={11} color={context.mood.color} />
                    <Text className="text-xs font-medium" style={{ color: context.mood.color }}>
                      {context.mood.label}
                    </Text>
                  </HStack>
                )}
              </HStack>

              <Text numberOfLines={3} className="text-sm leading-5 text-zinc-700 font-body">
                {context.note.content}
              </Text>

              <HStack className="gap-1.5 flex-wrap pt-0.5">
                {context.thoughts.map((thought) => (
                  <View key={thought.id} className="bg-violet-100 border border-violet-200 px-2 py-0.5 rounded-md">
                    <Text numberOfLines={1} className="text-xs font-medium text-violet-900">
                      “{thought.name}”
                    </Text>
                  </View>
                ))}
                {context.emotions.map((emotion) => (
                  <View key={emotion.id} className="bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                    <Text numberOfLines={1} className="text-xs font-medium text-blue-900">
                      {emotion.name}
                    </Text>
                  </View>
                ))}
              </HStack>

              <HStack className="items-center gap-1.5 pt-0.5">
                <CornerDownRight size={12} color="#71717A" />
                <Text className="text-xs font-subtitle text-zinc-500">
                  Respondendo à sua nota de {context.formattedDate}
                </Text>
              </HStack>
            </VStack>
          </HStack>

          <HStack className="gap-3 items-start pt-1">
            <Avatar className="w-8 h-8 bg-zinc-900">
              <AvatarFallbackText className="text-white text-xs font-semibold">
                {context.authorInitial}
              </AvatarFallbackText>
            </Avatar>
            <VStack className="flex-1 gap-2">
              <HStack className="items-center gap-2">
                <Text className="text-sm font-subtitle-semibold text-zinc-900">
                  {context.currentAuthorName}
                </Text>
                <View className="bg-zinc-100 border border-zinc-200 rounded-full px-2 py-0.5">
                  <Text className="text-xs font-semibold text-zinc-700">Reflexão</Text>
                </View>
              </HStack>

              <TextInput
                value={draft.content ?? ""}
                onChangeText={(content) => update({ content })}
                placeholder="Continuar esta nota..."
                placeholderTextColor="#9AA0AA"
                multiline
                scrollEnabled={false}
                style={{
                  minHeight: 72,
                  textAlignVertical: "top",
                  color: "#16181D",
                  fontSize: 16,
                  lineHeight: 22,
                }}
              />
              <Media images={draft.noteImages ?? []} onRemove={removeImage} onReplace={replaceImage} />
            </VStack>
          </HStack>
        </VStack>
      ) : (
        <View className="py-12 items-center justify-center">
          <Text className="text-sm font-subtitle text-zinc-500">Nota não encontrada</Text>
        </View>
      )}
    </ScrollView>
  );
}
