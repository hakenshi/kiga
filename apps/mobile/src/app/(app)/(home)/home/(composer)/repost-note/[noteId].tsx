import { Text } from "@/components/ui/text";
import ComposerTextArea from "@/components/composer/author-row";
import { Avatar, AvatarFallbackText } from "@/components/ui/avatar";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { useNoteStore } from "@/stores/note-store";
import { useRepostNoteCacheStore } from "@/stores/repost-note-cache-store";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";

export default function RepostNotePage() {
  const { noteId } = useLocalSearchParams<{ noteId: string }>();
  const findComposerNote = useNoteStore((s) => s.findComposerNote);
  const [context, setContext] = useState<Awaited<ReturnType<typeof findComposerNote>>>(null);
  const [isLoading, setIsLoading] = useState(true);
  const draft = useRepostNoteCacheStore((s) => s.note);
  const update = useRepostNoteCacheStore((s) => s.update);
  const removeImage = useRepostNoteCacheStore((s) => s.removeImage);
  const replaceImage = useRepostNoteCacheStore((s) => s.replaceImage);

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

  return (
    <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <ComposerTextArea
        placeholder="O que mudou desde então? Ou o que você percebe ao reler esta nota?"
        content={draft.content ?? ""}
        onChange={(content) => update({ content })}
        images={draft.noteImages ?? []}
        onRemoveImage={removeImage}
        onReplaceImage={replaceImage}
      />

      {isLoading ? (
        <View className="py-6 items-center justify-center">
          <ActivityIndicator size="small" color="#18181B" />
        </View>
      ) : context ? (
        <VStack className="mx-5 mb-4 p-4 bg-[#FAFAFA] border border-[#E4E4E7] rounded-2xl gap-2.5">
          <HStack className="justify-between items-center">
            <HStack className="items-center gap-2">
              <Avatar className="w-6 h-6 bg-[#E4E4E7]">
                <AvatarFallbackText className="text-zinc-700 text-[10px] font-semibold">
                  {context.authorInitial}
                </AvatarFallbackText>
              </Avatar>
              <Text className="text-xs font-subtitle-semibold text-zinc-800">
                {context.authorName}
              </Text>
              <Text className="text-zinc-400 text-xs">·</Text>
              <Text className="text-[11px] font-subtitle text-zinc-500">
                {context.formattedDate}
              </Text>
            </HStack>

            {context.mood && (
              <HStack
                className="items-center px-2 py-0.5 rounded-full border gap-1"
                style={{ backgroundColor: context.mood.bg, borderColor: context.mood.border }}
              >
                <context.mood.Icon size={10} color={context.mood.color} />
                <Text className="text-[10px] font-medium" style={{ color: context.mood.color }}>
                  {context.mood.label}
                </Text>
              </HStack>
            )}
          </HStack>

          <Text numberOfLines={4} className="text-[13px] leading-5 text-zinc-700 font-body">
            {context.note.content}
          </Text>

          <HStack className="gap-1.5 flex-wrap pt-0.5">
            {context.thoughts.map((thought) => (
              <View key={thought.id} className="bg-[#F0ECFA] border border-[#DFD6F5] px-2 py-0.5 rounded-md">
                <Text numberOfLines={1} className="text-[10.5px] font-medium text-[#4B3B8F]">
                  “{thought.name}”
                </Text>
              </View>
            ))}
            {context.emotions.map((emotion) => (
              <View key={emotion.id} className="bg-[#E8F1FB] border border-[#D0E3F7] px-2 py-0.5 rounded-md">
                <Text numberOfLines={1} className="text-[10.5px] font-medium text-[#1E4E8C]">
                  {emotion.name}
                </Text>
              </View>
            ))}
          </HStack>
        </VStack>
      ) : (
        <View className="py-6 items-center justify-center">
          <Text className="text-sm font-subtitle text-zinc-500">Nota não encontrada</Text>
        </View>
      )}
    </ScrollView>
  );
}
