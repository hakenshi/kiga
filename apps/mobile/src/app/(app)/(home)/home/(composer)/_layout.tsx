import NavButton from "@/components/common/nav-button";
import BehaviorsDrawer from "@/components/composer/drawers/behaviors-drawer";
import EmotionsDrawer from "@/components/composer/drawers/emotions-drawer";
import ReactionsDrawer from "@/components/composer/drawers/reactions-drawer";
import ThoughtsDrawer from "@/components/composer/drawers/thoughts-drawer";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Slot, usePathname, useRouter } from "expo-router";
import { ImageIcon, Lock, X } from "lucide-react-native";
import { KeyboardAvoidingView, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Button, ButtonText } from "@/components/ui/button";
import MoodRow from "@/components/composer/mood-row";
import { useEditNoteCacheStore } from "@/stores/edit-note-cache-store";
import { useNewNoteCacheStore } from "@/stores/new-note-cache-store";
import { useReplyNoteCacheStore } from "@/stores/reply-note-cache-store";
import { useRepostNoteCacheStore } from "@/stores/repost-note-cache-store";
import { selectDraftImageCount, selectDraftWordCount, type NoteDraftState } from "@/stores/note-draft";
import { useNoteStore } from "@/stores/note-store";
import { noteInsertSchema, noteUpdateSchema } from "@/lib/db/zod/schemas/note/index.schema";
import { useEffect } from "react";
import { useStore, type StoreApi } from "zustand";

type DraftStore = Pick<StoreApi<NoteDraftState>, "getState" | "getInitialState" | "subscribe">;

function WordCount({ wordCount }: { wordCount: number }) {
  return (
    <Text className="text-xs font-subtitle text-[#9AA0AA]">
      {wordCount} {wordCount === 1 ? "palavra" : "palavras"}
    </Text>
  );
}

function PhotoButton({ imageCount, onAddImages }: { imageCount: number; onAddImages: (uris: string[]) => void }) {

  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      const uris = result.assets.map(a => a.uri)
      onAddImages(uris)
    }
  };

  return (
    <NavButton Icon={ImageIcon} badge={imageCount} onPress={pick}>
      Foto
    </NavButton>
  );
}
export default function ComposerLayout() {
  const { bottom, top } = useSafeAreaInsets();
  const router = useRouter()
  const close = () => router.back()
  const addNote = useNoteStore(e => e.addNote)
  const updateNote = useNoteStore(e => e.updateNote)
  const currentPath = usePathname()
  const isNewNote = currentPath.includes("/home/new-note")
  const isEditing = currentPath.includes("/home/edit-note")
  const isReplying = currentPath.includes("/home/reply-note")
  const isReposting = currentPath.includes("/home/repost-note")
  const draftStore: DraftStore = isEditing
    ? useEditNoteCacheStore
    : isReplying
      ? useReplyNoteCacheStore
      : isReposting
        ? useRepostNoteCacheStore
        : useNewNoteCacheStore;
  const { note, clear, toggleMood, toggleResource, removeResources, addImages } = useStore(draftStore);
  const wordCount = useStore(draftStore, selectDraftWordCount);
  const imageCount = useStore(draftStore, selectDraftImageCount);

  useEffect(() => {
    draftStore.getState().revalidate();
  }, [draftStore]);

  const submit = () => {
    const currentNote = note
    const safeNote = noteInsertSchema.safeParse(currentNote)
    const safeUpdateNote = noteUpdateSchema.safeParse(currentNote)

    if (!safeNote.success) {
      console.log("deu xabu", safeNote.error.message)
      return
    } else if (!safeUpdateNote.success) {
      console.log("deu xabu", safeUpdateNote.error.message)
      return
    }
    if (isNewNote) {
      addNote(safeNote.data)
    }
    else if (isReplying) {
      addNote(safeNote.data)
    }
    else if (isReposting) {
      addNote(safeNote.data)
    }
    if (isEditing && safeUpdateNote.data.id) {
      updateNote(safeUpdateNote.data.id, safeUpdateNote.data)
    } else { }
    clear()
    router.back()
  }

  return (
    <VStack className="flex-1 bg-white" style={{ paddingBottom: bottom }}>
      <VStack style={{ paddingTop: top }} className="bg-white border-b border-gray-100">
        <HStack className="px-4 h-14 justify-between items-center">
          <View className="min-w-[40px] items-start justify-center">
            <Pressable
              onPress={close}
              className="w-10 h-10 rounded-full items-center justify-center active:bg-gray-100"
              hitSlop={8}
            >
              <X size={22} color="#16181D" />
            </Pressable>
          </View>
          <View className="min-w-[40px] items-end justify-center">
            <Button onPress={submit}>
              <ButtonText>
                Salvar
              </ButtonText>
            </Button>
          </View>
        </HStack>
        <MoodRow moodId={note.moodId} onSelect={toggleMood} />
      </VStack>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <Slot />

        <VStack className="bg-white border-t border-[#E6E8EC] pt-2 pb-1">
          <HStack className="justify-between px-5 pb-1.5 items-center">
            <WordCount wordCount={wordCount} />
            <HStack className="items-center gap-1">
              <Lock size={11} color="#9AA0AA" />
              <Text className="text-xs font-subtitle text-[#9AA0AA]">
                Salvo só neste aparelho
              </Text>
            </HStack>
          </HStack>
          <HStack className="px-2 items-center justify-around w-full">
            <EmotionsDrawer
              selectedIds={note.noteEmotions ?? []}
              onToggle={(id) => toggleResource("noteEmotions", id)}
              onRemove={(ids) => removeResources("noteEmotions", ids)}
            />
            <ThoughtsDrawer
              selectedIds={note.noteThoughts ?? []}
              onToggle={(id) => toggleResource("noteThoughts", id)}
            />
            <ReactionsDrawer
              selectedIds={note.noteReactions ?? []}
              onToggle={(id) => toggleResource("noteReactions", id)}
              onRemove={(ids) => removeResources("noteReactions", ids)}
            />
            <BehaviorsDrawer
              selectedIds={note.noteBehaviors ?? []}
              onToggle={(id) => toggleResource("noteBehaviors", id)}
              onRemove={(ids) => removeResources("noteBehaviors", ids)}
            />
            <PhotoButton imageCount={imageCount} onAddImages={addImages} />
          </HStack>
        </VStack>
      </KeyboardAvoidingView>
    </VStack>
  )
}
