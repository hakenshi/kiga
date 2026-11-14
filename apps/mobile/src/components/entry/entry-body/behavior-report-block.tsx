import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Footprints } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text } from "react-native";

export function BehaviorReportBlock({ text }: { text: string }) {
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
