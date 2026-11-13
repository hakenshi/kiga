import { Angry, Frown, Meh, Smile, Laugh } from "lucide-react-native";
import { Pressable, Text } from "react-native";
import { HStack } from "../ui/hstack";
import { useEntryCacheStore } from "@/stores/entry-cache-store";
import { useState } from "react";
import { Button, ButtonIcon, ButtonText } from "../ui/button";

const MOOD_OPTIONS = [
  { value: 1, label: "Muito Mal", Icon: Angry },
  { value: 2, label: "Mal", Icon: Frown },
  { value: 3, label: "Neutro", Icon: Meh },
  { value: 4, label: "Bem", Icon: Smile },
  { value: 5, label: "Muito Bem", Icon: Laugh },
] as const;

export default function MoodRow() {
  // const moodId = useComposer((s) => s.moodId);
  // const setMoodId = useComposer((s) => s.setMoodId);
  const cachedMoodId = useEntryCacheStore(e => e.moodId)
  const updateEntryCache = useEntryCacheStore(e => e.updateCachedEntry)

  const [moodId, setMoodId] = useState(cachedMoodId)
  const [isSelected, setIsSelected] = useState(false)
  const setCurrentMood = (value: number) => {
    setMoodId(value)
    if (value === moodId) {
      console.log(value)
      console.log(moodId)
      console.log(isSelected ? "selected" : "not sele")
      setIsSelected(!isSelected)
    }
    updateEntryCache({ moodId })
  }
  return (
    <HStack className="justify-between px-4 py-3 items-center border-b border-border">
      <Text className="text-[13px] font-subtitle text-muted-foreground">Como você está?</Text>
      <HStack className="items-center" space="xs">
        {MOOD_OPTIONS.map(({ value, Icon }) => {
          return (
            <Button
              key={value}
              onPress={() => setCurrentMood(value)}
              className="size-8 rounded-full items-center justify-center active:opacity-70"
              size="icon"
              variant={moodId === value && isSelected ? "default" : "secondary"}
            >
              <ButtonIcon size="lg" as={Icon} />
            </Button>
          );
        })}
      </HStack >
    </HStack >
  );
}
