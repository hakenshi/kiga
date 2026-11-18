import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import RevisitButton from "@/components/entry/entry-footer/revisit-button";
import {
  Drawer,
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
} from "@/components/ui/drawer";
import { Icon, CloseIcon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Pencil, RefreshCcw } from "lucide-react-native";
import { useAuthStore } from "@/stores/auth-store";
import { useNoteStore } from "@/stores/note-store";
import { useToastStore } from "@/stores/toast-store";

interface Props {
  entry: Note;
}

function RevisitAction({ entry, onClose }: { entry: Note; onClose: () => void }) {
  const userId = useAuthStore((s) => s.user!.id);
  const addNote = useNoteStore((s) => s.addNote);

  const handleSimpleRepost = () => {
    onClose();
    try {
      addNote({
        userId,
        noteType: "repost",
        content: entry.content,
        moodId: entry.moodId,
        noteBehaviors: entry.noteBehaviors.map(item => item.behaviorId),
        noteEmotions: entry.noteEmotions.map(item => item.emotionId),
        noteImages: entry.noteImages.map(item => item.imageUrl),
        noteReactions: entry.noteReactions.map(item => item.reactionId),
        noteThoughts: entry.noteThoughts.map(item => item.thoughtsId),
      });
      useToastStore.getState().showInfo("Momento revisitado.");
    } catch (err) {
      useToastStore.getState().showError("Falha ao revisitar momento.", err);
    }
  };

  return (
    <Pressable
      onPress={handleSimpleRepost}
      className="flex-row items-center gap-3.5 p-3.5 rounded-2xl active:bg-zinc-100"
    >
      <View className="w-10 h-10 rounded-full bg-zinc-100 items-center justify-center">
        <RefreshCcw size={18} color="#18181B" />
      </View>
      <VStack className="flex-1">
        <Text className="text-[14px] font-subtitle-semibold text-zinc-900">
          Revisitar
        </Text>
        <Text className="text-xs font-subtitle text-zinc-500">
          Republica este momento diretamente no feed
        </Text>
      </VStack>
    </Pressable>
  );
}

function QuoteAction({ entryId, onClose }: { entryId: number; onClose: () => void }) {
  const router = useRouter();

  const handleQuote = () => {
    onClose();
    router.push(`/home/repost-note/${entryId}`);
  };

  return (
    <Pressable
      onPress={handleQuote}
      className="flex-row items-center gap-3.5 p-3.5 rounded-2xl active:bg-zinc-100"
    >
      <View className="w-10 h-10 rounded-full bg-zinc-100 items-center justify-center">
        <Pencil size={18} color="#18181B" />
      </View>
      <VStack className="flex-1">
        <Text className="text-[14px] font-subtitle-semibold text-zinc-900">
          Citar pensamento
        </Text>
        <Text className="text-xs font-subtitle text-zinc-500">
          Adicione uma reflexão sobre este momento
        </Text>
      </VStack>
    </Pressable>
  );
}

export function RepostDrawer({ entry }: Props) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <RevisitButton onPress={() => setOpen(true)} />
      <Drawer anchor="bottom" isOpen={open} onClose={close} size="sm">
        <DrawerBackdrop />
        <DrawerContent className="rounded-t-3xl pb-6">
          <DrawerHeader className="border-b border-zinc-100 pb-3">
            <Text className="text-sm font-heading text-zinc-900">
              Revisitar momento
            </Text>
            <DrawerCloseButton>
              <Icon as={CloseIcon} className="stroke-zinc-500" />
            </DrawerCloseButton>
          </DrawerHeader>
          <DrawerBody className="p-4 gap-2">
            <RevisitAction entry={entry} onClose={close} />
            <QuoteAction entryId={entry.id} onClose={close} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}
