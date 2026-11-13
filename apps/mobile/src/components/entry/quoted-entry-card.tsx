import React from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Avatar, AvatarFallbackText } from "@/components/ui/avatar";
import { HStack } from "@/components/ui/hstack";
import { resolveMoodConfig } from "@/lib/mood-utils";
import { useAuthStore } from "@/stores/auth-store";
import { formatEntryDate } from "@/lib/utils";

export function QuotedEntryCard({ entry }: { entry: JournalEntryWithRelations }) {
  const router = useRouter();
  const { user } = useAuthStore();

  const authorName =
    entry.userId === user?.id
      ? `${user?.firstName ?? ""} ${user?.secondName ?? ""}`.trim()
      : "Registro original";
  const initialLetter = authorName.charAt(0) || user?.firstName?.charAt(0) || "U";
  const mood = resolveMoodConfig(entry);
  const thoughts = (entry.entryThoughts ?? []).map((t) => t.thought?.name).filter(Boolean);
  const emotions = (entry.entryEmotions ?? []).map((e) => e.emotion?.name).filter(Boolean);

  return (
    <Pressable
      onPress={() => router.push(`/(home)/home/view-post/${entry.id}`)}
      className="mt-1 rounded-2xl border border-zinc-200 bg-zinc-50 p-3.5 gap-2 active:opacity-80"
    >
      <HStack className="justify-between items-center">
        <HStack className="items-center gap-2">
          <Avatar className="w-5 h-5 bg-[#E4E4E7]">
            <AvatarFallbackText className="text-zinc-700 text-[9px] font-semibold">
              {initialLetter}
            </AvatarFallbackText>
          </Avatar>
          <Text className="text-xs font-subtitle-semibold text-zinc-800">
            {authorName}
          </Text>
          <Text className="text-zinc-400 text-xs">·</Text>
          <Text className="text-[11px] font-subtitle text-zinc-500">
            {formatEntryDate(entry.date)}
          </Text>
        </HStack>

        {mood && (
          <HStack
            className="items-center px-2 py-0.5 rounded-full border gap-1"
            style={{
              backgroundColor: mood.bg,
              borderColor: mood.border,
            }}
          >
            <mood.Icon size={10} color={mood.color} />
            <Text
              className="text-[10px] font-medium"
              style={{ color: mood.color }}
            >
              {mood.label}
            </Text>
          </HStack>
        )}
      </HStack>

      {entry.content ? (
        <Text numberOfLines={3} className="text-[13px] leading-5 text-zinc-700 font-body">
          {entry.content}
        </Text>
      ) : null}

      {(thoughts.length > 0 || emotions.length > 0) && (
        <HStack className="gap-1.5 flex-wrap pt-0.5">
          {thoughts.map((name, i) => (
            <View
              key={`qth-${i}`}
              className="bg-[#F0ECFA] border border-[#DFD6F5] px-2 py-0.5 rounded-md"
            >
              <Text numberOfLines={1} className="text-[10.5px] font-medium text-[#4B3B8F]">
                “{name}”
              </Text>
            </View>
          ))}
          {emotions.map((name, i) => (
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
    </Pressable>
  );
}
