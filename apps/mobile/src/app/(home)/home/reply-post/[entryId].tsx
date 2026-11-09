import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CornerDownRight } from "lucide-react-native";

import { Composer } from "@/components/composer/composer";
import { useComposerDraftStore } from "@/components/composer/composer-slice";
import { Avatar, AvatarFallbackText } from "@/components/ui/avatar";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { createJournalEntry, getEntryWithThread } from "@/repositories/entry-repository";
import { resolveMoodConfig } from "@/lib/mood-utils";
import { useAuthStore } from "@/stores/auth-store";
import { useEntryStore } from "@/stores/journal-store";
import { useToastStore } from "@/stores/toast-store";

function formatParentTime(rawDate?: Date | string | number | null) {
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

export default function ReplyPostPage() {
  const router = useRouter();
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const user = useAuthStore((s) => s.user);
  const addEntry = useEntryStore((s) => s.addEntry);

  const [rootEntry, setRootEntry] = useState<JournalEntryWithRelations | null>(null);
  const [existingRepliesCount, setExistingRepliesCount] = useState(0);
  const [isLoadingThread, setIsLoadingThread] = useState(true);

  useEffect(() => {
    if (!entryId) return;
    const numId = Number(entryId);
    useComposerDraftStore.getState().reset();
    setIsLoadingThread(true);
    getEntryWithThread(numId)
      .then((thread) => {
        if (thread) {
          setRootEntry(thread.rootEntry);
          setExistingRepliesCount(thread.replies.length);
        }
      })
      .finally(() => setIsLoadingThread(false));
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
      if (!state.content.trim()) return;
      if (!rootEntry) return;

      useComposerDraftStore.setState({ isSaving: true });
      try {
        const newReply = await createJournalEntry({
          userId: user!.id,
          entryType: "reply",
          parentEntryId: rootEntry.id,
          content: state.content,
          moodId: state.moodId,
          emotions: state.emotions,
          thoughts: state.thoughts,
          reactions: state.reactions,
          behaviors: state.behaviors,
          images: state.images,
          date: state.entryDate,
        });

        addEntry(newReply);
        state.reset();
        useToastStore.getState().showInfo("Reflexão adicionada à linha do tempo.");
        if (router.canGoBack()) {
          router.back();
        } else {
          router.push(`/(home)/home/view-post/${rootEntry.id}`);
        }
      } catch (err) {
        useToastStore.getState().showError("Falha ao salvar a reflexão.", err);
        useComposerDraftStore.setState({ isSaving: false });
      }
    },
  };

  const parentMood = resolveMoodConfig(rootEntry ?? undefined);
  const stepNumber = existingRepliesCount + 1;
  const parentAuthorName = rootEntry?.userId === user?.id
    ? `${user?.firstName ?? ""} ${user?.secondName ?? ""}`.trim()
    : "Autor do pensamento";

  const parentThoughts = (rootEntry?.entryThoughts ?? [])
    .map((t) => t.thought?.name)
    .filter(Boolean);
  const parentEmotions = (rootEntry?.entryEmotions ?? [])
    .map((e) => e.emotion?.name)
    .filter(Boolean);

  return (
    <Composer.Provider store={useComposerDraftStore} actions={actions}>
      <Composer.Frame>
        <Composer.Header
          title={<Composer.DateTitle />}
          submit={<Composer.Submit pendingLabel="Respondendo...">Responder</Composer.Submit>}
        />
        <Composer.MoodRow />

        <Composer.Body>
          {isLoadingThread && !rootEntry ? (
            <View className="py-12 items-center justify-center">
              <ActivityIndicator size="small" color="#18181B" />
            </View>
          ) : rootEntry ? (
            <VStack className="px-4 pt-4 pb-2">
              <HStack className="gap-3 items-stretch">
                <VStack className="items-center">
                  <Avatar className="w-8 h-8 bg-[#F4F4F5] border border-[#E4E4E7]">
                    <AvatarFallbackText className="text-zinc-700 text-xs font-semibold">
                      {user?.firstName?.charAt(0) ?? "F"}
                    </AvatarFallbackText>
                  </Avatar>
                  <View className="w-[2px] bg-zinc-200 flex-1 my-1" />
                </VStack>

                <VStack className="flex-1 pb-4 gap-2">
                  <HStack className="justify-between items-center">
                    <HStack className="items-center gap-1.5 flex-wrap">
                      <Text className="text-[13px] font-subtitle-semibold text-zinc-900">
                        {parentAuthorName}
                      </Text>
                      <Text className="text-zinc-400 text-xs">·</Text>
                      <Text className="text-xs font-subtitle text-zinc-500">
                        {formatParentTime(rootEntry.date)}
                      </Text>
                    </HStack>

                    {parentMood && (
                      <HStack
                        className="items-center px-2 py-0.5 rounded-full border gap-1"
                        style={{
                          backgroundColor: parentMood.bg,
                          borderColor: parentMood.border,
                        }}
                      >
                        <parentMood.Icon size={11} color={parentMood.color} />
                        <Text
                          className="text-[10.5px] font-medium"
                          style={{ color: parentMood.color }}
                        >
                          {parentMood.label}
                        </Text>
                      </HStack>
                    )}
                  </HStack>

                  <Text
                    numberOfLines={3}
                    className="text-[13.5px] leading-5 text-zinc-700 font-body"
                  >
                    {rootEntry.content}
                  </Text>

                  {(parentThoughts.length > 0 || parentEmotions.length > 0) && (
                    <HStack className="gap-1.5 flex-wrap pt-0.5">
                      {parentThoughts.map((name, i) => (
                        <View
                          key={`pth-${i}`}
                          className="bg-[#F0ECFA] border border-[#DFD6F5] px-2 py-0.5 rounded-md"
                        >
                          <Text numberOfLines={1} className="text-[11px] font-medium text-[#4B3B8F]">
                            “{name}”
                          </Text>
                        </View>
                      ))}
                      {parentEmotions.map((name, i) => (
                        <View
                          key={`pem-${i}`}
                          className="bg-[#E8F1FB] border border-[#D0E3F7] px-2 py-0.5 rounded-md"
                        >
                          <Text numberOfLines={1} className="text-[11px] font-medium text-[#1E4E8C]">
                            {name}
                          </Text>
                        </View>
                      ))}
                    </HStack>
                  )}

                  <HStack className="items-center gap-1.5 pt-0.5">
                    <CornerDownRight size={12} color="#71717A" />
                    <Text className="text-[11.5px] font-subtitle text-zinc-500">
                      Respondendo ao seu registro de {formatParentTime(rootEntry.date)}
                    </Text>
                  </HStack>
                </VStack>
              </HStack>

              <HStack className="gap-3 items-start pt-1">
                <Avatar className="w-8 h-8 bg-zinc-900">
                  <AvatarFallbackText className="text-white text-xs font-semibold">
                    {user?.firstName?.charAt(0) ?? "F"}
                  </AvatarFallbackText>
                </Avatar>

                <VStack className="flex-1 gap-2">
                  <HStack className="items-center gap-2">
                    <Text className="text-[13px] font-subtitle-semibold text-zinc-900">
                      {user?.firstName} {user?.secondName}
                    </Text>
                    <View className="bg-zinc-100 border border-zinc-200 rounded-full px-2 py-0.5">
                      <Text className="text-[10.5px] font-semibold text-zinc-700">
                        Reflexão #{stepNumber}
                      </Text>
                    </View>
                  </HStack>

                  <Composer.Editor placeholder="Continuar este pensamento..." />
                  <Composer.Media />
                </VStack>
              </HStack>
            </VStack>
          ) : null}
        </Composer.Body>

        <Composer.ChipStrip />
        <Composer.Dock />
      </Composer.Frame>
    </Composer.Provider>
  );
}
