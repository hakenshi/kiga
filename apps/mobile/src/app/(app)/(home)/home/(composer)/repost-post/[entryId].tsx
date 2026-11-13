import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

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

export default function RepostPostPage() {
  const router = useRouter();
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const user = useAuthStore((s) => s.user);
  const addEntry = useEntryStore((s) => s.addEntry);

  // const [quotedEntry, setQuotedEntry] = useState<JournalEntryWithRelations | null>(null);
  // const [isLoadingQuoted, setIsLoadingQuoted] = useState(true);
  //
  // useEffect(() => {
  //   if (!entryId) return;
  //   const numId = Number(entryId);
  //   useComposerDraftStore.getState().reset();
  //   setIsLoadingQuoted(true);
  //   EntryRepository.getById(numId)
  //     .then((entry) => setQuotedEntry(entry))
  //     .finally(() => setIsLoadingQuoted(false));
  // }, [entryId]);

  const [quotedEntry, setQuotedEntry] = useState(null)

  const actions = {
    close: () => {
      useComposerDraftStore.getState().reset();
      if (router.canGoBack()) {
        router.back();
      } else {
        router.push("/home");
      }
    },
    submit: async () => {
      const state = useComposerDraftStore.getState();
      if (!quotedEntry) return;

      useComposerDraftStore.setState({ isSaving: true });
      try {
        // const newRepost = await EntryRepository.createRepost({
        //   userId: user!.id,
        //   parentEntryId: quotedEntry.id,
        //   content: state.content.trim(),
        //   moodId: state.moodId,
        //   emotions: state.emotions,
        //   thoughts: state.thoughts,
        //   reactions: state.reactions,
        //   behaviors: state.behaviors,
        //   images: state.images,
        //   date: state.entryDate,
        // });
        //
        // addEntry(newRepost);
        // state.reset();
        // useToastStore.getState().showInfo("Momento revisitado e republicado.");
        // if (router.canGoBack()) {
        //   router.back();
        // } else {
        //   router.push("/(home)/home");
        // }
      } catch (err) {
        useToastStore.getState().showError("Falha ao republicar momento.", err);
        useComposerDraftStore.setState({ isSaving: false });
      }
    },
  };

  const quotedMood = resolveMoodConfig(quotedEntry ?? undefined);
  const quotedAuthorName = quotedEntry?.userId === user?.id
    ? `${user?.firstName ?? ""} ${user?.secondName ?? ""}`.trim()
    : "Autor do pensamento";

  const quotedThoughts = (quotedEntry?.entryThoughts ?? [])
    .map((t) => t.thought?.name)
    .filter(Boolean);
  const quotedEmotions = (quotedEntry?.entryEmotions ?? [])
    .map((e) => e.emotion?.name)
    .filter(Boolean);

  return (
    <Text>
      Wip
    </Text>
  );
}
