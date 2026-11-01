import { VStack } from "@/components/ui/vstack";
import { useState } from "react";
import { Pressable, Text } from "react-native";

interface Props {
  entry?: JournalEntryWithRelations;
  content?: string;
}

export default function EntryBody({ entry, content: contentProp }: Props) {
  const content = entry?.content ?? contentProp ?? "";
  const [expand, setExpand] = useState(false);
  const maxChars = 280;

  const shouldTruncate = content.length > maxChars;

  const getCleanPreview = (str: string, limit: number) => {
    const sub = str.slice(0, limit);
    return sub.slice(0, sub.lastIndexOf(" "));
  };

  const displayText =
    !expand && shouldTruncate ? getCleanPreview(content, maxChars) : content;

  return (
    <VStack className="pb-2" space="md">
      <Text className="py-2 px-1" style={{ fontSize: 14, lineHeight: 20 }}>
        {shouldTruncate && !expand ? `${displayText}...` : displayText}
      </Text>
      {shouldTruncate && !expand && (
        <Pressable onPress={() => setExpand((e) => !e)}>
          <Text className="font-semibold underline">Ver Mais</Text>
        </Pressable>
      )}
    </VStack>
  );
}
