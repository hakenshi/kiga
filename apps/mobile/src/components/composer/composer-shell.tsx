import NavButton from "@/components/common/nav-button";
import BehaviorsDrawer from "@/components/composer/drawers/behaviors-drawer";
import EmotionsDrawer from "@/components/composer/drawers/emotions-drawer";
import ReactionsDrawer from "@/components/composer/drawers/reactions-drawer";
import ThoughtsDrawer from "@/components/composer/drawers/thoughts-drawer";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { ImageIcon, Lock } from "lucide-react-native";
import { KeyboardAvoidingView, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { selectDraftImageCount, selectDraftWordCount, type NoteDraftState } from "@/stores/note-draft";
import type { PropsWithChildren, ReactNode } from "react";
import { useStore, type StoreApi } from "zustand";

type DraftStore = Pick<StoreApi<NoteDraftState>, "getState" | "getInitialState" | "subscribe">;

interface Props extends PropsWithChildren {
  draftStore: DraftStore;
  header: ReactNode;
}

function WordCount({ wordCount }: { wordCount: number }) {
  return (
    <Text className="text-xs font-subtitle text-zinc-400">
      {wordCount} {wordCount === 1 ? "palavra" : "palavras"}
    </Text>
  );
}

export default function ComposerShell({ draftStore, header, children }: Props) {
  const { bottom } = useSafeAreaInsets();
  const { note, toggleResource, removeResources, addImages } = useStore(draftStore);
  const wordCount = useStore(draftStore, selectDraftWordCount);
  const imageCount = useStore(draftStore, selectDraftImageCount);

  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], allowsMultipleSelection: true, quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      addImages(result.assets.map(asset => asset.uri));
    }
  };

  return (
    <VStack className="flex-1 bg-white" style={{ paddingBottom: bottom }}>
      {header}
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        {children}

        <VStack className="bg-white border-t border-gray-200 pt-2 pb-1">
          <HStack className="justify-between px-5 pb-1.5 items-center">
            <WordCount wordCount={wordCount} />
            <HStack className="items-center gap-1">
              <Lock size={11} color="#9AA0AA" />
              <Text className="text-xs font-subtitle text-zinc-400">
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
            <NavButton Icon={ImageIcon} badge={imageCount} onPress={pick}>Foto</NavButton>
          </HStack>
        </VStack>
      </KeyboardAvoidingView>
    </VStack>
  )
}
