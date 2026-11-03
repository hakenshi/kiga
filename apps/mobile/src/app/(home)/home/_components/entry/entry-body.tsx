import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { getBehaviorIcon } from "@/lib/behavior-icons";
import { Image } from "expo-image";
import { Activity, Brain, Drama, Footprints } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, View } from "react-native";

interface Props {
  entry?: JournalEntryWithRelations;
  content?: string;
}

function EntryImageItem({ uri }: { uri: string }) {
  const [aspectRatio, setAspectRatio] = useState(4 / 3);

  return (
    <View
      className="w-full rounded-2xl overflow-hidden border border-[#E6E8EC] bg-[#F8F9FA]"
      style={{ aspectRatio }}
    >
      <Image
        source={{ uri }}
        style={{ width: "100%", height: "100%" }}
        contentFit="contain"
        onLoad={(e) => {
          if (e.source.width && e.source.height) {
            setAspectRatio(e.source.width / e.source.height);
          }
        }}
      />
    </View>
  );
}

function EntryMediaGrid({ urls }: { urls: string[] }) {
  if (urls.length === 0) return null;

  return (
    <VStack space="sm" className="w-full">
      {urls.map((uri, idx) => (
        <EntryImageItem key={`${uri}-${idx}`} uri={uri} />
      ))}
    </VStack>
  );
}

function BehaviorReportBlock({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 140;

  return (
    <VStack className="bg-[#F4FAF6] border border-[#CBEAD9] rounded-xl px-3.5 py-2.5 gap-1">
      <HStack className="items-center gap-1.5">
        <Footprints size={13} color="#166534" />
        <Text className="text-[11px] font-subtitle-semibold text-[#166534]">
          O que eu fiz (Comportamento)
        </Text>
      </HStack>
      <Text
        numberOfLines={expanded ? undefined : 3}
        className="text-[13.5px] leading-[19px] text-[#14532D]"
      >
        {text}
      </Text>
      {isLong && (
        <Pressable
          onPress={() => setExpanded((v) => !v)}
          className="self-start pt-0.5"
        >
          <Text className="text-xs font-subtitle-semibold text-[#166534] underline">
            {expanded ? "Mostrar menos" : "Ver mais"}
          </Text>
        </Pressable>
      )}
    </VStack>
  );
}

export default function EntryBody({ entry, content: contentProp }: Props) {
  const content = entry?.content ?? contentProp ?? "";
  const images = entry?.entryImages ?? [];
  const emotions = (entry?.entryEmotions ?? [])
    .map((item) => item.emotion)
    .filter((em): em is Emotion => Boolean(em?.name));
  const thoughts = (entry?.entryThoughts ?? [])
    .map((item) => item.thought)
    .filter((th): th is Thought => Boolean(th?.name));
  const reactions = (entry?.entryReactions ?? [])
    .map((item) => item.reaction)
    .filter((re): re is Reaction => Boolean(re?.name));
  const behaviors = (entry?.entryBehaviors ?? [])
    .map((item) => item.behavior)
    .filter((be): be is Behavior => Boolean(be?.content));

  const behaviorReports = behaviors.filter((be) => !be.icon);
  const behaviorChips = behaviors.filter((be) => Boolean(be.icon));

  const hasRelations =
    thoughts.length > 0 ||
    emotions.length > 0 ||
    reactions.length > 0 ||
    behaviorReports.length > 0 ||
    behaviorChips.length > 0;

  const [expand, setExpand] = useState(false);
  const maxChars = 280;

  const shouldTruncate = content.length > maxChars;

  const getCleanPreview = (str: string, limit: number) => {
    const sub = str.slice(0, limit);
    const lastSpace = sub.lastIndexOf(" ");
    return lastSpace > 0 ? sub.slice(0, lastSpace) : sub;
  };

  const displayText =
    !expand && shouldTruncate ? getCleanPreview(content, maxChars) : content;

  return (
    <VStack className="pt-0.5 pb-1" space="md">
      {content.length > 0 && (
        <VStack space="xs">
          <Text className="text-[15px] leading-[22px] text-[#1A1D24]">
            {shouldTruncate && !expand ? `${displayText}...` : displayText}
          </Text>
          {shouldTruncate && (
            <Pressable
              onPress={() => setExpand((e) => !e)}
              className="self-start py-0.5"
            >
              <Text className="text-xs font-subtitle-semibold text-[#111318] underline">
                {expand ? "Mostrar menos" : "Ver mais"}
              </Text>
            </Pressable>
          )}
        </VStack>
      )}

      {images.length > 0 && (
        <EntryMediaGrid urls={images.map((img) => img.imageUrl)} />
      )}

      {hasRelations && (
        <VStack className="gap-2 pt-0.5">
          {behaviorReports.map((be, idx) => (
            <BehaviorReportBlock
              key={`be-rep-${be.id}-${idx}`}
              text={be.content ?? ""}
            />
          ))}

          {thoughts.length > 0 && (
            <View className="flex-row flex-wrap gap-1.5">
              {thoughts.map((th, idx) => (
                <View
                  key={`th-${th.id}-${idx}`}
                  className="flex-row items-center bg-[#F0ECFA] border border-[#DFD6F5] rounded-[10px] px-2.5 py-1.5 gap-1.5 max-w-full"
                >
                  <Brain size={13} color="#4B3B8F" />
                  <Text className="text-[12px] font-medium text-[#4B3B8F] shrink">
                    “{th.name}”
                  </Text>
                </View>
              ))}
            </View>
          )}

          {(emotions.length > 0 ||
            reactions.length > 0 ||
            behaviorChips.length > 0) && (
            <View className="flex-row flex-wrap gap-1.5">
              {emotions.map((em, idx) => (
                <View
                  key={`em-${em.id}-${idx}`}
                  className="flex-row items-center bg-[#E8F1FB] border border-[#D0E3F7] rounded-[10px] px-2.5 py-1 gap-1.5"
                >
                  <Drama size={12} color="#1E4E8C" />
                  <Text className="text-[12px] font-medium text-[#1E4E8C]">
                    {em.name}
                  </Text>
                </View>
              ))}

              {reactions.map((re, idx) => (
                <View
                  key={`re-${re.id}-${idx}`}
                  className="flex-row items-center bg-[#FDF3E2] border border-[#F7E3BE] rounded-[10px] px-2.5 py-1 gap-1.5"
                >
                  <Activity size={12} color="#8A5A12" />
                  <Text className="text-[12px] font-medium text-[#8A5A12]">
                    {re.name}
                  </Text>
                </View>
              ))}

              {behaviorChips.map((be, idx) => {
                const iconElement = React.createElement(
                  getBehaviorIcon(be.icon),
                  {
                    size: 12,
                    color: "#166534",
                  }
                );
                return (
                  <View
                    key={`be-${be.id}-${idx}`}
                    className="flex-row items-center bg-[#EAF6F0] border border-[#CBEAD9] rounded-[10px] px-2.5 py-1 gap-1.5"
                  >
                    {iconElement}
                    <Text className="text-[12px] font-medium text-[#166534]">
                      {be.content}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </VStack>
      )}
    </VStack>
  );
}
