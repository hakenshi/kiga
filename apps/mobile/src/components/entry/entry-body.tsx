import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { getBehaviorIcon } from "@/lib/behavior-icons";
import { EntryRepository } from "@/repositories/entry-repository";
import { Activity, Brain, ChevronDown, ChevronUp, Drama, Footprints } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ImageCarousel } from "@/components/image-carousel";
import { useRouter } from "expo-router";
import { QuotedEntryCard } from "./quoted-entry-card";

interface Props {
  entry?: JournalEntryWithRelations;
  content?: string;
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
  const router = useRouter();
  const [lazyParent, setLazyParent] = useState<JournalEntryWithRelations | null>(null);

  const preloadedQuoted =
    (entry?.parentRepost as any)?.parentEntry ||
    (entry?.parentReply as any)?.parentEntry;

  const quotedEntry = (preloadedQuoted || lazyParent) as JournalEntryWithRelations | undefined;

  useEffect(() => {
    if (entry?.entryType === "repost" && !preloadedQuoted && entry?.id && !lazyParent) {
      EntryRepository.getParent(entry.id).then((p) => {
        if (p) setLazyParent(p);
      });
    }
  }, [entry?.id, entry?.entryType, preloadedQuoted, lazyParent]);

  const isPureRepost = entry?.entryType === "repost" && !entry?.content?.trim();
  const sourceEntry = (isPureRepost && quotedEntry) ? quotedEntry : entry;

  const content = sourceEntry?.content ?? contentProp ?? "";
  const images = sourceEntry?.entryImages ?? [];
  const emotions = (sourceEntry?.entryEmotions ?? [])
    .map((item) => item.emotion)
    .filter((em): em is Emotion => Boolean(em?.name));
  const thoughts = (sourceEntry?.entryThoughts ?? [])
    .map((item) => item.thought)
    .filter((th): th is Thought => Boolean(th?.name));
  const reactions = (sourceEntry?.entryReactions ?? [])
    .map((item) => item.reaction)
    .filter((re): re is Reaction => Boolean(re?.name));
  const behaviors = (sourceEntry?.entryBehaviors ?? [])
    .map((item) => item.behavior)
    .filter((be): be is Behavior => Boolean(be?.content));

  const behaviorReports = behaviors.filter((be) => !be.icon);
  const behaviorChips = behaviors.filter((be) => Boolean(be.icon));

  const totalChips =
    thoughts.length +
    emotions.length +
    reactions.length +
    behaviorChips.length;

  const [expandedTags, setExpandedTags] = useState(false);
  const isCrowded = totalChips > 3;
  const showSummaryPills = isCrowded && !expandedTags;

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
          <Text className="font-inter leading-5 text-zinc-900 text-base">
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
        <ImageCarousel images={images.map((img) => img.imageUrl)} />
      )}

      {hasRelations && (
        <VStack className="gap-2 pt-0.5">
          {behaviorReports.map((be, idx) => (
            <BehaviorReportBlock
              key={`be-rep-${be.id}-${idx}`}
              text={be.content ?? ""}
            />
          ))}

          {showSummaryPills ? (
            /* Modo Resumo Clínico: Pílulas agrupadas compactas */
            <View className="flex-row flex-wrap items-center gap-1.5 pt-0.5">
              {thoughts.length > 0 && (
                <Pressable
                  onPress={() => setExpandedTags(true)}
                  className="flex-row items-center bg-[#F0ECFA] border border-[#DFD6F5] rounded-full px-3 py-1.5 gap-1.5 active:opacity-75"
                >
                  <Brain size={13} color="#4B3B8F" />
                  <Text className="text-[12px] font-heading text-[#4B3B8F]">
                    {thoughts.length} {thoughts.length === 1 ? "pensamento" : "pensamentos"}
                  </Text>
                  <ChevronDown size={13} color="#4B3B8F" />
                </Pressable>
              )}

              {emotions.length > 0 && (
                <Pressable
                  onPress={() => setExpandedTags(true)}
                  className="flex-row items-center bg-[#E8F1FB] border border-[#D0E3F7] rounded-full px-3 py-1.5 gap-1.5 active:opacity-75"
                >
                  <Drama size={13} color="#1E4E8C" />
                  <Text className="text-[12px] font-heading text-[#1E4E8C]">
                    {emotions.length} {emotions.length === 1 ? "emoção" : "emoções"}
                  </Text>
                  <ChevronDown size={13} color="#1E4E8C" />
                </Pressable>
              )}

              {reactions.length > 0 && (
                <Pressable
                  onPress={() => setExpandedTags(true)}
                  className="flex-row items-center bg-[#FDF3E2] border border-[#F7E3BE] rounded-full px-3 py-1.5 gap-1.5 active:opacity-75"
                >
                  <Activity size={13} color="#8A5A12" />
                  <Text className="text-[12px] font-heading text-[#8A5A12]">
                    {reactions.length} {reactions.length === 1 ? "reação" : "reações"}
                  </Text>
                  <ChevronDown size={13} color="#8A5A12" />
                </Pressable>
              )}

              {behaviorChips.length > 0 && (
                <Pressable
                  onPress={() => setExpandedTags(true)}
                  className="flex-row items-center bg-[#EAF6F0] border border-[#CBEAD9] rounded-full px-3 py-1.5 gap-1.5 active:opacity-75"
                >
                  <Footprints size={13} color="#166534" />
                  <Text className="text-[12px] font-heading text-[#166534]">
                    {behaviorChips.length} {behaviorChips.length === 1 ? "ação" : "ações"}
                  </Text>
                  <ChevronDown size={13} color="#166534" />
                </Pressable>
              )}
            </View>
          ) : (
            /* Modo Expandido ou Poucas Tags: Renderiza todas as tags */
            <>
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

              {isCrowded && expandedTags && (
                <Pressable
                  onPress={() => setExpandedTags(false)}
                  className="self-start py-1 flex-row items-center gap-1 active:opacity-60"
                >
                  <ChevronUp size={13} color="#68707C" />
                  <Text className="text-[11.5px] font-subtitle-semibold text-[#68707C] underline">
                    Recolher tags ({totalChips})
                  </Text>
                </Pressable>
              )}
            </>
          )}
        </VStack>
      )}

      {!isPureRepost && quotedEntry && <QuotedEntryCard entry={quotedEntry} />}
    </VStack>
  );
}
