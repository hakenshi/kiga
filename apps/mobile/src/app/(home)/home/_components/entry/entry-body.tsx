import { VStack } from "@/components/ui/vstack";
import { TEXT_DATA } from "@/lib/text-data";
import { useState } from "react";
import { Pressable, Text } from "react-native";

export default function EntryBody() {

  const [expand, setExpand] = useState(false)
  const maxChars = 280

  const shouldTruncate = TEXT_DATA.length > maxChars

  const getCleanPreview = (str: string, limit: number) => {
    const sub = str.slice(0, limit)
    return sub.slice(0, sub.lastIndexOf(' '))
  }

  const displayText = (!expand && shouldTruncate) ? getCleanPreview(TEXT_DATA, maxChars) : TEXT_DATA

  return (
    <VStack className="pb-2" space="md">
      <Text style={{ fontSize: 14, lineHeight: 20 }}>
        {(shouldTruncate && !expand) ? `${displayText}...` : displayText}
      </Text>
      {(shouldTruncate && !expand) && (
        <Pressable onPress={() => setExpand(e => !e)}>
          <Text className="font-semibold underline">
            Ver Mais
          </Text>
        </Pressable>
      )}
    </VStack >
  )
}
