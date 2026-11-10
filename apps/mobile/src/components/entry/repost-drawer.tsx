import React from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import {
  Drawer,
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
} from "@/components/ui/drawer";
import { HStack } from "@/components/ui/hstack";
import { Icon, CloseIcon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Pencil, RefreshCcw } from "lucide-react-native";
import { EntryRepository } from "@/repositories/entry-repository";
import { useAuthStore } from "@/stores/auth-store";
import { useEntryStore } from "@/stores/journal-store";
import { useToastStore } from "@/stores/toast-store";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  entry?: JournalEntryWithRelations;
}

export function RepostDrawer({ isOpen, onClose, entry }: Props) {
  const router = useRouter();
  const { user } = useAuthStore();
  const addEntry = useEntryStore((s) => s.addEntry);

  if (!entry) return null;

  const targetId =
    entry.entryType === "repost" && (entry.parentRepost?.parentEntryId || entry.parentReply?.parentEntryId)
      ? (entry.parentRepost?.parentEntryId || entry.parentReply?.parentEntryId)!
      : entry.id;

  const handleSimpleRepost = async () => {
    if (!user) return;
    onClose();
    try {
      const newRepost = await EntryRepository.createRepost({
        userId: user.id,
        parentEntryId: targetId,
      });
      addEntry(newRepost);
      useToastStore.getState().showInfo("Momento revisitado.");
    } catch (err) {
      useToastStore.getState().showError("Falha ao revisitar momento.", err);
    }
  };

  const handleQuote = () => {
    onClose();
    router.push(`/(home)/home/repost-post/${targetId}`);
  };

  return (
    <Drawer anchor="bottom" isOpen={isOpen} onClose={onClose} size="sm">
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
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
