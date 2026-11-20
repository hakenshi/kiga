import { Text } from "@/components/ui/text";
import Media from "@/components/composer/media";
import { Avatar, AvatarFallbackText } from "@/components/ui/avatar";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { useReplyNoteCacheStore } from "@/stores/reply-note-cache-store";
import { useComposerNote } from "@/queries/notes/queries";
import ReplyNoteHeader from "@/components/composer/reply-note-header";
import ComposerShell from "@/components/composer/composer-shell";
import { useAuthStore } from "@/stores/auth-store";
import { useLocalSearchParams } from "expo-router";
import { CornerDownRight } from "lucide-react-native";
import { ScrollView, TextInput, View } from "react-native";
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
  const userId = useAuthStore(s => s.user!.id);
  const { context } = useComposerNote(userId, noteId);
  const draft = useReplyNoteCacheStore((s) => s.note);
  const update = useReplyNoteCacheStore((s) => s.update);
  const removeImage = useReplyNoteCacheStore((s) => s.removeImage);
  const replaceImage = useReplyNoteCacheStore((s) => s.replaceImage);

  return (
    <ComposerShell draftStore={useReplyNoteCacheStore} header={<ReplyNoteHeader />}>
    <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {context ? (
        <VStack className="px-4 pt-4 pb-2">
          <HStack className="gap-3 items-stretch">
            <VStack className="items-center">
              <Avatar className="w-8 h-8 bg-zinc-100 border border-zinc-200">
                <AvatarFallbackText className="text-zinc-700 text-xs font-semibold">
                  {context.userName}
                </AvatarFallbackText>
              </Avatar>
              <View className="w-0.5 bg-zinc-200 flex-1 my-1" />
            </VStack>

            <VStack className="flex-1 pb-4 gap-2">
              <HStack className="justify-between items-center">
                <HStack className="items-center gap-1.5 flex-wrap">
                  <Text className="text-sm font-subtitle-semibold text-zinc-900">
                    {context.userName}
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
                  {context.userName}
              </AvatarFallbackText>
            </Avatar>
            <VStack className="flex-1 gap-2">
              <HStack className="items-center gap-2">
                <Text className="text-sm font-subtitle-semibold text-zinc-900">
                  {context.userName}
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
    </ComposerShell>
  );
}
