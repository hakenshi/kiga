import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Activity,
  ArrowLeft,
  Brain,
  CornerDownRight,
  Drama,
  Footprints,
  Heart,
  RefreshCcw,
} from "lucide-react-native";

import { ImageCarousel } from "@/components/image-carousel";
import { Avatar, AvatarFallbackText } from "@/components/ui/avatar";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { getBehaviorIcon } from "@/lib/behavior-icons";
import {
  getEntryWithThread,
  getParentEntry,
  type EntryThreadResult,
} from "@/repositories/entry-repository";
import { resolveMoodConfig } from "@/lib/mood-utils";
import { useAuthStore } from "@/stores/auth-store";
import { useEntryStore } from "@/stores/journal-store";
import { QuotedEntryCard } from "@/components/entry/quoted-entry-card";
import { RepostDrawer } from "@/components/entry/repost-drawer";

function formatTimelineDelta(rootDate: Date, replyDate: Date): string {
  const diffMs = replyDate.getTime() - rootDate.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));
  const diffHours = Math.floor(diffMinutes / 60);
  const remainingMinutes = diffMinutes % 60;
  const diffDays = Math.floor(diffHours / 24);

  const timeStr = replyDate.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const weekdayStr = replyDate
    .toLocaleDateString("pt-BR", { weekday: "short" })
    .replace(".", "");
  const capitalizedWeekday =
    weekdayStr.charAt(0).toUpperCase() + weekdayStr.slice(1);

  let deltaPrefix = "";
  if (diffDays >= 1) {
    deltaPrefix = `${diffDays} ${diffDays === 1 ? "dia" : "dias"} depois`;
  } else if (diffHours >= 1) {
    deltaPrefix =
      remainingMinutes > 0
        ? `+${diffHours}h ${remainingMinutes}m depois`
        : `+${diffHours}h depois`;
  } else if (diffMinutes > 0) {
    deltaPrefix = `+${diffMinutes}m depois`;
  } else {
    deltaPrefix = "Pouco depois";
  }

  return `${deltaPrefix} · ${capitalizedWeekday} ${timeStr}`;
}

function formatFocalTime(rawDate?: Date | string | number | null) {
  if (!rawDate) return "";
  const d = new Date(rawDate);
  const timeStr = d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const weekdayStr = d
    .toLocaleDateString("pt-BR", { weekday: "long" })
    .replace("-feira", "");
  const capitalizedWeekday =
    weekdayStr.charAt(0).toUpperCase() + weekdayStr.slice(1);
  const dayMonth = d
    .toLocaleDateString("pt-BR", { day: "numeric", month: "short" })
    .replace(".", "");
  return `${capitalizedWeekday} · ${timeStr} · ${dayMonth}`;
}

export default function ViewPostPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const user = useAuthStore((s) => s.user);
  const updateEntry = useEntryStore((s) => s.updateEntry);

  const [threadData, setThreadData] = useState<EntryThreadResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [repostOpen, setRepostOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!entryId) return;
    const numId = Number(entryId);
    const result = await getEntryWithThread(numId);
    setThreadData(result);
    setLoading(false);
  }, [entryId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const rootEntry = threadData?.rootEntry;
  const replies = threadData?.replies ?? [];

  const [lazyParent, setLazyParent] = useState<JournalEntryWithRelations | null>(null);

  const preloadedQuoted =
    (rootEntry?.parentRepost as any)?.parentEntry ||
    (rootEntry?.parentReply as any)?.parentEntry;

  const quotedEntry = (preloadedQuoted || lazyParent) as JournalEntryWithRelations | undefined;

  useEffect(() => {
    if (rootEntry?.entryType === "repost" && !preloadedQuoted && rootEntry?.id && !lazyParent) {
      getParentEntry(rootEntry.id).then((p) => {
        if (p) setLazyParent(p);
      });
    }
  }, [rootEntry?.id, rootEntry?.entryType, preloadedQuoted, lazyParent]);

  const handleLike = () => {
    if (!rootEntry) return;
    const newLiked = !rootEntry.liked;
    updateEntry(rootEntry.id, { liked: newLiked });
    setThreadData((prev) =>
      prev
        ? {
            ...prev,
            rootEntry: { ...prev.rootEntry, liked: newLiked },
          }
        : null
    );
  };

  if (loading && !rootEntry) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="small" color="#18181B" />
      </View>
    );
  }

  if (!rootEntry) {
    return (
      <View className="flex-1 bg-white items-center justify-center p-6 gap-3">
        <Text className="text-base font-semibold text-zinc-800">
          Registro não encontrado
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="bg-zinc-100 px-4 py-2 rounded-full"
        >
          <Text className="text-xs font-semibold text-zinc-700">Voltar</Text>
        </Pressable>
      </View>
    );
  }

  const isPureRepost = rootEntry.entryType === "repost" && !rootEntry.content?.trim();
  const displayEntry = (isPureRepost && quotedEntry) ? quotedEntry : rootEntry;

  const rootMood = resolveMoodConfig(displayEntry);
  const rootThoughts = (displayEntry.entryThoughts ?? [])
    .map((t) => t.thought?.name)
    .filter(Boolean);
  const rootEmotions = (displayEntry.entryEmotions ?? [])
    .map((e) => e.emotion?.name)
    .filter(Boolean);
  const rootReactions = (displayEntry.entryReactions ?? [])
    .map((r) => r.reaction?.name)
    .filter(Boolean);
  const rootBehaviors = (displayEntry.entryBehaviors ?? [])
    .map((b) => b.behavior)
    .filter((b): b is NonNullable<typeof b> => Boolean(b?.content));
  const rootImages = (displayEntry.entryImages ?? []).map((img) => img.imageUrl);

  const authorName = `${user?.firstName ?? ""} ${user?.secondName ?? ""}`.trim();
  const authorHandle = user?.username ? `@${user.username}` : "";

  const subtitleLabel =
    replies.length === 0
      ? "Pensamento original"
      : replies.length === 1
      ? "1 reflexão registrada"
      : `${replies.length} reflexões registradas`;

  return (
    <View className="flex-1 bg-[#FAFAFA]">
      <View
        style={{ paddingTop: insets.top }}
        className="bg-white border-b border-zinc-200"
      >
        <HStack className="px-4 h-14 items-center justify-between">
          <HStack className="items-center gap-3">
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              className="w-9 h-9 rounded-full items-center justify-center active:bg-zinc-100"
            >
              <ArrowLeft size={20} color="#18181B" />
            </Pressable>
            <VStack>
              <Text className="text-[15px] font-heading text-zinc-900">
                Pensamento & Thread
              </Text>
              <Text className="text-[11.5px] font-subtitle text-zinc-500">
                {subtitleLabel}
              </Text>
            </VStack>
          </HStack>
        </HStack>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
      >
        <VStack className="bg-white border-b border-zinc-200 p-5 gap-3.5">
          {rootEntry.entryType === "repost" && (
            <HStack className="items-center gap-1.5 pb-0.5">
              <RefreshCcw size={12} color="#71717A" />
              <Text className="text-[11.5px] font-subtitle-medium text-zinc-500">
                Revisitou um momento
              </Text>
            </HStack>
          )}

          <HStack className="justify-between items-center">
            <HStack className="items-center gap-3">
              <Avatar className="w-10 h-10 bg-[#F4F4F5] border border-[#E4E4E7]">
                <AvatarFallbackText className="text-zinc-800 text-sm font-semibold">
                  {user?.firstName?.charAt(0) ?? "F"}
                </AvatarFallbackText>
              </Avatar>
              <VStack>
                <Text className="text-[14.5px] font-subtitle-semibold text-zinc-900">
                  {authorName}
                </Text>
                <Text className="text-xs font-subtitle text-zinc-500">
                  {authorHandle} · {formatFocalTime(displayEntry.date)}
                </Text>
              </VStack>
            </HStack>

            {rootMood && (
              <HStack
                className="items-center px-2.5 py-1 rounded-full border gap-1.5"
                style={{
                  backgroundColor: rootMood.bg,
                  borderColor: rootMood.border,
                }}
              >
                <rootMood.Icon size={13} color={rootMood.color} />
                <Text
                  className="text-[11px] font-medium"
                  style={{ color: rootMood.color }}
                >
                  {rootMood.label}
                </Text>
              </HStack>
            )}
          </HStack>

          <Text className="text-[16.5px] leading-[25px] font-medium text-zinc-900 font-body">
            {displayEntry.content}
          </Text>

          {rootImages.length > 0 && <ImageCarousel images={rootImages} />}

          {(rootThoughts.length > 0 ||
            rootEmotions.length > 0 ||
            rootReactions.length > 0 ||
            rootBehaviors.length > 0) && (
            <HStack className="gap-2 flex-wrap pt-1">
              {rootThoughts.map((name, i) => (
                <View
                  key={`r-th-${i}`}
                  className="flex-row items-center bg-[#F0ECFA] border border-[#DFD6F5] rounded-lg px-2.5 py-1 gap-1.5"
                >
                  <Brain size={12} color="#4B3B8F" />
                  <Text className="text-[11.5px] font-medium text-[#4B3B8F]">
                    “{name}”
                  </Text>
                </View>
              ))}

              {rootEmotions.map((name, i) => (
                <View
                  key={`r-em-${i}`}
                  className="flex-row items-center bg-[#E8F1FB] border border-[#D0E3F7] rounded-lg px-2.5 py-1 gap-1.5"
                >
                  <Drama size={12} color="#1E4E8C" />
                  <Text className="text-[11.5px] font-medium text-[#1E4E8C]">
                    {name}
                  </Text>
                </View>
              ))}

              {rootReactions.map((name, i) => (
                <View
                  key={`r-re-${i}`}
                  className="flex-row items-center bg-[#FDF3E2] border border-[#F7E3BE] rounded-lg px-2.5 py-1 gap-1.5"
                >
                  <Activity size={12} color="#8A5A12" />
                  <Text className="text-[11.5px] font-medium text-[#8A5A12]">
                    {name}
                  </Text>
                </View>
              ))}

              {rootBehaviors.map((be, i) => {
                const IconComponent = getBehaviorIcon(be.icon);
                return (
                  <View
                    key={`r-be-${i}`}
                    className="flex-row items-center bg-[#EAF6F0] border border-[#CBEAD9] rounded-lg px-2.5 py-1 gap-1.5"
                  >
                    <IconComponent size={12} color="#166534" />
                    <Text className="text-[11.5px] font-medium text-[#166534]">
                      {be.content}
                    </Text>
                  </View>
                );
              })}
            </HStack>
          )}

          {!isPureRepost && quotedEntry && <QuotedEntryCard entry={quotedEntry} />}

          <HStack className="justify-between items-center pt-2 border-t border-zinc-100">
            <HStack className="gap-2 items-center">
              <Pressable
                onPress={() =>
                  router.push(`/(home)/home/reply-post/${rootEntry.id}`)
                }
                hitSlop={8}
                className="flex-row items-center bg-zinc-100 py-1.5 px-3.5 rounded-full gap-1.5 active:opacity-60"
              >
                <CornerDownRight size={12} color="#18181B" />
                <Text className="text-xs text-zinc-900 font-semibold">
                  Continuar
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setRepostOpen(true)}
                hitSlop={8}
                className="flex-row items-center bg-zinc-100 py-1.5 px-3.5 rounded-full gap-1.5 active:opacity-60"
              >
                <RefreshCcw size={12} color="#18181B" />
                <Text className="text-xs text-zinc-900 font-semibold">
                  Revisitar
                </Text>
              </Pressable>

              <Pressable
                onPress={handleLike}
                hitSlop={8}
                className="flex-row items-center bg-zinc-100 py-1.5 px-3.5 rounded-full gap-1.5 active:opacity-60"
              >
                <Heart
                  fill={rootEntry.liked ? "#EF4444" : "none"}
                  strokeWidth={rootEntry.liked ? 0 : 2}
                  size={12}
                  color={rootEntry.liked ? "#EF4444" : "#68707C"}
                />
                <Text className="text-xs text-zinc-900 font-semibold">
                  {rootEntry.liked ? "Remover" : "Guardar"}
                </Text>
              </Pressable>
            </HStack>
          </HStack>
        </VStack>

        {replies.length > 0 && (
          <VStack className="px-5 pt-6 gap-4">
            <HStack className="justify-between items-center">
              <Text className="text-[14px] font-heading text-zinc-900">
                Linha do tempo das reflexões ({replies.length})
              </Text>
              <Text className="text-xs font-subtitle text-zinc-500">
                Desdobramento no tempo
              </Text>
            </HStack>

            <VStack className="pt-2">
              {replies.map((reply, index) => {
                const replyMood = resolveMoodConfig(reply);
                const stepNum = index + 1;
                const isLast = index === replies.length - 1;

                const replyThoughts = (reply.entryThoughts ?? [])
                  .map((t) => t.thought?.name)
                  .filter(Boolean);
                const replyEmotions = (reply.entryEmotions ?? [])
                  .map((e) => e.emotion?.name)
                  .filter(Boolean);
                const replyReactions = (reply.entryReactions ?? [])
                  .map((r) => r.reaction?.name)
                  .filter(Boolean);
                const replyBehaviors = (reply.entryBehaviors ?? [])
                  .map((b) => b.behavior)
                  .filter((b): b is NonNullable<typeof b> => Boolean(b?.content));
                const replyImages = (reply.entryImages ?? []).map(
                  (img) => img.imageUrl
                );

                return (
                  <HStack key={`step-${reply.id}`} className="items-stretch gap-3.5">
                    <VStack className="items-center w-7">
                      <View className="w-7 h-7 rounded-full bg-white border-2 border-zinc-300 items-center justify-center">
                        <Text className="text-[11px] font-bold text-zinc-700">
                          {stepNum}
                        </Text>
                      </View>
                      {!isLast && (
                        <View className="w-[2px] bg-zinc-200 flex-1 my-1" />
                      )}
                    </VStack>

                    <VStack className="flex-1 bg-white border border-zinc-200 rounded-2xl p-4 gap-2.5 mb-4">
                      <HStack className="justify-between items-center">
                        <Text className="text-[11.5px] font-subtitle-semibold text-zinc-500">
                          {formatTimelineDelta(
                            new Date(rootEntry.date),
                            new Date(reply.date)
                          )}
                        </Text>

                        {replyMood && (
                          <HStack
                            className="items-center px-2 py-0.5 rounded-full border gap-1"
                            style={{
                              backgroundColor: replyMood.bg,
                              borderColor: replyMood.border,
                            }}
                          >
                            <replyMood.Icon size={11} color={replyMood.color} />
                            <Text
                              className="text-[10px] font-medium"
                              style={{ color: replyMood.color }}
                            >
                              {replyMood.label}
                            </Text>
                          </HStack>
                        )}
                      </HStack>

                      <Text className="text-[14px] leading-5 text-zinc-800 font-body">
                        {reply.content}
                      </Text>

                      {replyImages.length > 0 && (
                        <ImageCarousel images={replyImages} />
                      )}

                      {(replyThoughts.length > 0 ||
                        replyEmotions.length > 0 ||
                        replyReactions.length > 0 ||
                        replyBehaviors.length > 0) && (
                        <HStack className="gap-1.5 flex-wrap pt-0.5">
                          {replyThoughts.map((name, i) => (
                            <View
                              key={`step-th-${i}`}
                              className="bg-[#F0ECFA] border border-[#DFD6F5] px-2 py-0.5 rounded-md"
                            >
                              <Text
                                numberOfLines={1}
                                className="text-[10.5px] font-medium text-[#4B3B8F]"
                              >
                                “{name}”
                              </Text>
                            </View>
                          ))}
                          {replyEmotions.map((name, i) => (
                            <View
                              key={`step-em-${i}`}
                              className="bg-[#E8F1FB] border border-[#D0E3F7] px-2 py-0.5 rounded-md"
                            >
                              <Text
                                numberOfLines={1}
                                className="text-[10.5px] font-medium text-[#1E4E8C]"
                              >
                                {name}
                              </Text>
                            </View>
                          ))}
                          {replyReactions.map((name, i) => (
                            <View
                              key={`step-re-${i}`}
                              className="bg-[#FDF3E2] border border-[#F7E3BE] px-2 py-0.5 rounded-md"
                            >
                              <Text
                                numberOfLines={1}
                                className="text-[10.5px] font-medium text-[#8A5A12]"
                              >
                                {name}
                              </Text>
                            </View>
                          ))}
                          {replyBehaviors.map((be, i) => {
                            const IconComponent = getBehaviorIcon(be.icon);
                            return (
                              <View
                                key={`step-be-${i}`}
                                className="flex-row items-center bg-[#EAF6F0] border border-[#CBEAD9] px-2 py-0.5 rounded-md gap-1"
                              >
                                <IconComponent size={10} color="#166534" />
                                <Text
                                  numberOfLines={1}
                                  className="text-[10.5px] font-medium text-[#166534]"
                                >
                                  {be.content}
                                </Text>
                              </View>
                            );
                          })}
                        </HStack>
                      )}
                    </VStack>
                  </HStack>
                );
              })}
            </VStack>
          </VStack>
        )}
      </ScrollView>

      <View
        style={{ paddingBottom: insets.bottom + 8 }}
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-zinc-200 px-4 pt-2.5"
      >
        <Pressable
          onPress={() =>
            router.push(`/(home)/home/reply-post/${rootEntry.id}`)
          }
          className="bg-zinc-100 rounded-full px-4 py-2.5 flex-row items-center justify-between active:opacity-75"
        >
          <Text className="text-xs text-zinc-500 font-subtitle">
            Continuar esta reflexão no tempo...
          </Text>
          <CornerDownRight size={15} color="#18181B" />
        </Pressable>
      </View>

      <RepostDrawer
        isOpen={repostOpen}
        onClose={() => setRepostOpen(false)}
        entry={rootEntry}
      />
    </View>
  );
}
