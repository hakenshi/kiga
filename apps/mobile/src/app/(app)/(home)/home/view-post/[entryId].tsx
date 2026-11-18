import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { Link, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Activity,
  ArrowLeft,
  Brain,
  CornerDownRight,
  Drama,
  Heart,
  RefreshCcw,
} from "lucide-react-native";

import { ImageCarousel } from "@/components/image-carousel";
import { Avatar, AvatarFallbackText } from "@/components/ui/avatar";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { getBehaviorIcon } from "@/lib/behavior-icons";
import { resolveMoodConfig } from "@/lib/mood-utils";
import { useAuthStore } from "@/stores/auth-store";
import { useNoteStore } from "@/stores/note-store";
import { useToastStore } from "@/stores/toast-store";
import { RepostDrawer } from "@/components/entry/repost-drawer";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function formatFocalTime(rawDate?: Date | string | number | null) {
  if (!rawDate) return "";
  const d = new Date(rawDate);
  const timeStr = format(d, "HH:mm");
  const weekdayStr = format(d, "EEEE", { locale: ptBR }).replace("-feira", "");
  const capitalizedWeekday =
    weekdayStr.charAt(0).toUpperCase() + weekdayStr.slice(1);
  const dayMonth = format(d, "d 'de' MMM", { locale: ptBR });
  return `${capitalizedWeekday} · ${timeStr} · ${dayMonth}`;
}

export default function ViewPostPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const user = useAuthStore((s) => s.user);
  const updateNote = useNoteStore((s) => s.updateNote);
  const findNote = useNoteStore((s) => s.findNote);

  const [rootEntry, setRootEntry] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!entryId) return;
    const numId = Number(entryId);
    try {
      const entry = await findNote(numId);
      setRootEntry(entry);
    } catch (error) {
      useToastStore.getState().showError("Falha ao carregar o relato.", error);
    } finally {
      setLoading(false);
    }
  }, [entryId, findNote]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleLike = () => {
    if (!rootEntry) return;
    const newLiked = !rootEntry.liked;
    updateNote(rootEntry.id, { liked: newLiked });
    setRootEntry((prev) =>
      prev
        ? {
            ...prev,
            liked: newLiked,
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

  const rootMood = resolveMoodConfig(rootEntry);
  const rootThoughts = rootEntry.noteThoughts
    .map((t) => t.thought?.name)
    .filter(Boolean);
  const rootEmotions = rootEntry.noteEmotions
    .map((e) => e.emotion?.name)
    .filter(Boolean);
  const rootReactions = rootEntry.noteReactions
    .map((r) => r.reaction?.name)
    .filter(Boolean);
  const rootBehaviors = rootEntry.noteBehaviors
    .map((b) => b.behavior)
    .filter((b): b is NonNullable<typeof b> => Boolean(b?.content));
  const rootImages = rootEntry.noteImages.map((img) => img.imageUrl);

  const authorName = `${user?.firstName ?? ""} ${user?.secondName ?? ""}`.trim();
  const authorHandle = user?.username ? `@${user.username}` : "";

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
                Pensamento
              </Text>
              <Text className="text-[11.5px] font-subtitle text-zinc-500">
                Registro do diário
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
          {rootEntry.isRepost && (
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
                  {authorHandle} · {formatFocalTime(rootEntry.date)}
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
            {rootEntry.content}
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

          <HStack className="justify-between items-center pt-2 border-t border-zinc-100">
            <HStack className="gap-2 items-center">
              <Link href={`/home/reply-post/${rootEntry.id}`} push asChild>
                <Pressable
                  hitSlop={8}
                  className="flex-row items-center bg-zinc-100 py-1.5 px-3.5 rounded-full gap-1.5 active:opacity-60"
                >
                  <CornerDownRight size={12} color="#18181B" />
                  <Text className="text-xs text-zinc-900 font-semibold">
                    Continuar
                  </Text>
                </Pressable>
              </Link>

              <RepostDrawer entry={rootEntry} />

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

      </ScrollView>

      <View
        style={{ paddingBottom: insets.bottom + 8 }}
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-zinc-200 px-4 pt-2.5"
      >
        <Link href={`/home/reply-post/${rootEntry.id}`} push asChild>
          <Pressable className="bg-zinc-100 rounded-full px-4 py-2.5 flex-row items-center justify-between active:opacity-75">
            <Text className="text-xs text-zinc-500 font-subtitle">
              Continuar esta reflexão no tempo...
            </Text>
            <CornerDownRight size={15} color="#18181B" />
          </Pressable>
        </Link>
      </View>

    </View>
  );
}
