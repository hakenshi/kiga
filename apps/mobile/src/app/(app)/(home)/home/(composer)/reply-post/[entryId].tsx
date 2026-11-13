import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CornerDownRight } from "lucide-react-native";

import { Composer } from "@/components/composer/frame";
import { useComposerDraftStore } from "@/components/composer/composer-slice";
import { Avatar, AvatarFallbackText } from "@/components/ui/avatar";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { EntryRepository } from "@/repositories/entry-repository";
import { resolveMoodConfig } from "@/lib/mood-utils";
import { useAuthStore } from "@/stores/auth-store";
import { useEntryStore } from "@/stores/journal-store";
import { useToastStore } from "@/stores/toast-store";
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
export default function ReplyPostPage() {
  // const router = useRouter();
  // const { entryId } = useLocalSearchParams<{ entryId: string }>();
  // const user = useAuthStore((s) => s.user);
  // const addEntry = useEntryStore((s) => s.addEntry);
  //
  // const [rootEntry, setRootEntry] = useState<JournalEntryWithRelations | null>(null);
  // const [existingRepliesCount, setExistingRepliesCount] = useState(0);
  // const [isLoadingThread, setIsLoadingThread] = useState(true);
  //
  // useEffect(() => {
  //   if (!entryId) return;
  //   const numId = Number(entryId);
  //   useComposerDraftStore.getState().reset();
  //   setIsLoadingThread(true);
  //   EntryRepository.getThread(numId)
  //     .then((thread) => {
  //       if (thread) {
  //         setRootEntry(thread.rootEntry);
  //         setExistingRepliesCount(thread.replies.length);
  //       }
  //     })
  //     .finally(() => setIsLoadingThread(false));
  // }, [entryId]);
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
  //     if (!rootEntry) return;
  //
  //     useComposerDraftStore.setState({ isSaving: true });
  //     try {
  //       const newReply = await EntryRepository.createReply({
  //         userId: user!.id,
  //         parentEntryId: rootEntry.id,
  //         content: state.content,
  //         moodId: state.moodId,
  //         emotions: state.emotions,
  //         thoughts: state.thoughts,
  //         reactions: state.reactions,
  //         behaviors: state.behaviors,
  //         images: state.images,
  //         date: state.entryDate,
  //       });
  //
  //       addEntry(newReply);
  //       state.reset();
  //       useToastStore.getState().showInfo("Reflexão adicionada à linha do tempo.");
  //       if (router.canGoBack()) {
  //         router.back();
  //       } else {
  //         router.push(`/(home)/home/view-post/${rootEntry.id}`);
  //       }
  //     } catch (err) {
  //       useToastStore.getState().showError("Falha ao salvar a reflexão.", err);
  //       useComposerDraftStore.setState({ isSaving: false });
  //     }
  //   },
  // };
  //
  // const parentMood = resolveMoodConfig(rootEntry ?? undefined);
  // const stepNumber = existingRepliesCount + 1;
  // const parentAuthorName = rootEntry?.userId === user?.id
  //   ? `${user?.firstName ?? ""} ${user?.secondName ?? ""}`.trim()
  //   : "Autor do pensamento";
  //
  // const parentThoughts = (rootEntry?.entryThoughts ?? [])
  //   .map((t) => t.thought?.name)
  //   .filter(Boolean);
  // const parentEmotions = (rootEntry?.entryEmotions ?? [])
  //   .map((e) => e.emotion?.name)
  //   .filter(Boolean);
  //
  return (
    <Text>
      wip
    </Text>
  );
}
