import { VStack } from "@/components/ui/vstack";
import { useState } from "react";
import { Pressable, Text } from "react-native";
import { useNote } from "../note-context";
export default function Content() {

  const [expand, setExpand] = useState(false);
  const maxChars = 280;

  const { note: { content } } = useNote()

  const shouldTruncate = content.length > maxChars;

  const getCleanPreview = (str: string, limit: number) => {
    const sub = str.slice(0, limit);
    const lastSpace = sub.lastIndexOf(" ");
    return lastSpace > 0 ? sub.slice(0, lastSpace) : sub;
  };

  const displayText = !expand && shouldTruncate ? getCleanPreview(content, maxChars) : content;

  return (

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
  )
}
