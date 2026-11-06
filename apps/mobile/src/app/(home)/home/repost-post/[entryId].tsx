import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { Composer } from "@/components/composer/composer";
import { useComposerDraftStore } from "@/components/composer/composer-slice";
import { Avatar, AvatarFallbackText } from "@/components/ui/avatar";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { createJournalEntry, getJournalEntryById } from "@/lib/db/entries";
import { resolveMoodConfig } from "@/lib/mood-utils";
import { useAuthStore } from "@/stores/auth-store";
import { useEntryStore } from "@/stores/journal-store";
import { useToastStore } from "@/stores/toast-store";

function formatQuotedTime(rawDate?: Date | string | number | null) {
  if (!rawDate) return "";
  const d = new Date(rawDate);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  const timeStr = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (isToday) return `Hoje · ${timeStr}`;

  const dayMonth = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
  return `${dayMonth} · ${timeStr}`;
}

export default function RepostPostPage() {
  const router = useRouter();
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const { user } = useAuthStore();
  const { addEntry } = useEntryStore();

  const [quotedEntry, setQuotedEntry] = useState<JournalEntryWithRelations | null>(null);
  const [isLoadingQuoted, setIsLoadingQuoted] = useState(true);

  useEffect(() => {
    if (!entryId) return;
    const numId = Number(entryId);
    useComposerDraftStore.getState().reset();
    setIsLoadingQuoted(true);
    getJournalEntryById(numId)
      .then((entry) => setQuotedEntry(entry))
      .finally(() => setIsLoadingQuoted(false));
  }, [entryId]);

  const actions = {
    close: () => {
      useComposerDraftStore.getState().reset();
      if (router.canGoBack()) {
        router.back();
      } else {
        router.push("/(home)/home");
      }
    },
    submit: async () => {
      const state = useComposerDraftStore.getState();
      if (!quotedEntry) return;

      useComposerDraftStore.setState({ isSaving: true });
      try {
        const newRepost = await createJournalEntry({
          userId: user!.id,
          entryType: "repost",
          parentEntryId: quotedEntry.id,
          content: state.content.trim(),
          moodId: state.moodId,
          emotions: state.emotions,
          thoughts: state.thoughts,
          reactions: state.reactions,
          behaviors: state.behaviors,
          images: state.images,
          date: state.entryDate,
        });

        addEntry(newRepost);
        state.reset();
        useToastStore.getState().showInfo("Momento revisitado e republicado.");
        if (router.canGoBack()) {
          router.back();
        } else {
          router.push("/(home)/home");
        }
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
    <Composer.Provider store={useComposerDraftStore} actions={actions}>
      <Composer.Frame>
        <Composer.Header
          title={
            <>
              <Composer.DateTitle />
              <Text className="text-[11px] font-subtitle text-zinc-400">
                Revisitar registro
              </Text>
            </>
          }
          submit={<Composer.Submit pendingLabel="Republicando...">Republicar</Composer.Submit>}
        />
        <Composer.MoodRow />

        <Composer.Body>
          <Composer.AuthorRow>
            <Composer.Editor placeholder="O que mudou desde então? Ou o que você percebe ao reler este momento?" />
            <Composer.Media />
          </Composer.AuthorRow>

          {isLoadingQuoted && !quotedEntry ? (
            <View className="py-6 items-center justify-center">
              <ActivityIndicator size="small" color="#18181B" />
            </View>
          ) : quotedEntry ? (
            <VStack className="mx-5 mb-4 p-4 bg-[#FAFAFA] border border-[#E4E4E7] rounded-2xl gap-2.5">
              <HStack className="justify-between items-center">
                <HStack className="items-center gap-2">
                  <Avatar className="w-6 h-6 bg-[#E4E4E7]">
                    <AvatarFallbackText className="text-zinc-700 text-[10px] font-semibold">
                      {user?.firstName?.charAt(0) ?? "F"}
                    </AvatarFallbackText>
                  </Avatar>
                  <Text className="text-xs font-subtitle-semibold text-zinc-800">
                    {quotedAuthorName}
                  </Text>
                  <Text className="text-zinc-400 text-xs">·</Text>
                  <Text className="text-[11px] font-subtitle text-zinc-500">
                    {formatQuotedTime(quotedEntry.date)}
                  </Text>
                </HStack>

                {quotedMood && (
                  <HStack
                    className="items-center px-2 py-0.5 rounded-full border gap-1"
                    style={{
                      backgroundColor: quotedMood.bg,
                      borderColor: quotedMood.border,
                    }}
                  >
                    <quotedMood.Icon size={10} color={quotedMood.color} />
                    <Text
                      className="text-[10px] font-medium"
                      style={{ color: quotedMood.color }}
                    >
                      {quotedMood.label}
                    </Text>
                  </HStack>
                )}
              </HStack>

              <Text numberOfLines={4} className="text-[13px] leading-5 text-zinc-700 font-body">
                {quotedEntry.content}
              </Text>

              {(quotedThoughts.length > 0 || quotedEmotions.length > 0) && (
                <HStack className="gap-1.5 flex-wrap pt-0.5">
                  {quotedThoughts.map((name, i) => (
                    <View
                      key={`qth-${i}`}
                      className="bg-[#F0ECFA] border border-[#DFD6F5] px-2 py-0.5 rounded-md"
                    >
                      <Text numberOfLines={1} className="text-[10.5px] font-medium text-[#4B3B8F]">
                        “{name}”
                      </Text>
                    </View>
                  ))}
                  {quotedEmotions.map((name, i) => (
                    <View
                      key={`qem-${i}`}
                      className="bg-[#E8F1FB] border border-[#D0E3F7] px-2 py-0.5 rounded-md"
                    >
                      <Text numberOfLines={1} className="text-[10.5px] font-medium text-[#1E4E8C]">
                        {name}
                      </Text>
                    </View>
                  ))}
                </HStack>
              )}
            </VStack>
          ) : null}
        </Composer.Body>

        <Composer.ChipStrip />
        <Composer.Dock />
      </Composer.Frame>
    </Composer.Provider>
  );
}
