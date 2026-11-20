import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import RevisitButton from "@/components/note/note-footer/revisit-button";
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
import { noteMutations } from "@/queries/notes/queries";
import { useNote } from "./note-context";

function RevisitAction({ note, onClose }: { note: Note; onClose: () => void }) {
  const client = useQueryClient();
  const revisit = useMutation(noteMutations.revisit(client, note.userId));

  const handleSimpleRepost = () => {
    onClose();
    revisit.mutate(note);
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
        <Text className="text-sm font-subtitle-semibold text-zinc-900">
          Revisitar
        </Text>
        <Text className="text-xs font-subtitle text-zinc-500">
          Republica esta nota diretamente no feed
        </Text>
      </VStack>
    </Pressable>
  );
}

function QuoteAction({ noteId, onClose }: { noteId: number; onClose: () => void }) {
  const router = useRouter();

  const handleQuote = () => {
    onClose();
    router.push(`/home/repost-note/${noteId}`);
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
        <Text className="text-sm font-subtitle-semibold text-zinc-900">
          Citar nota
        </Text>
        <Text className="text-xs font-subtitle text-zinc-500">
          Adicione uma reflexão sobre esta nota
        </Text>
      </VStack>
    </Pressable>
  );
}

export function RepostDrawer() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const { note } = useNote()

  return (
    <>
      <RevisitButton onPress={() => setOpen(true)} />
      <Drawer anchor="bottom" isOpen={open} onClose={close} size="sm">
        <DrawerBackdrop />
        <DrawerContent className="rounded-t-3xl pb-6">
          <DrawerHeader className="border-b border-zinc-100 pb-3">
            <Text className="text-sm font-heading text-zinc-900">
              Revisitar nota
            </Text>
            <DrawerCloseButton>
              <Icon as={CloseIcon} className="stroke-zinc-500" />
            </DrawerCloseButton>
          </DrawerHeader>
          <DrawerBody className="p-4 gap-2">
            <RevisitAction note={note} onClose={close} />
            <QuoteAction noteId={note.id} onClose={close} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}
