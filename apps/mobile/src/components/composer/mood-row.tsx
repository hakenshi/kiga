import { Angry, Frown, Meh, Smile, Laugh } from "lucide-react-native";
import { Text } from "react-native";
import { HStack } from "../ui/hstack";
import { Button, ButtonIcon } from "../ui/button";

const MOOD_OPTIONS = [
  { value: 1, label: "Muito Mal", Icon: Angry },
  { value: 2, label: "Mal", Icon: Frown },
  { value: 3, label: "Neutro", Icon: Meh },
  { value: 4, label: "Bem", Icon: Smile },
  { value: 5, label: "Muito Bem", Icon: Laugh },
] as const;

interface Props {
  moodId: NoteUpdate["moodId"];
  onSelect: (moodId: number) => void;
}

export default function MoodRow({ moodId, onSelect }: Props) {
  return (
    <HStack className="justify-between px-4 py-3 items-center border-b border-border">
      <Text className="text-[13px] font-subtitle text-muted-foreground">Como você está?</Text>
      <HStack className="items-center" space="xs">
        {MOOD_OPTIONS.map(({ value, Icon }) => {
          return (
            <Button
              key={value}
              onPress={() => onSelect(value)}
              className="size-8 rounded-full items-center justify-center active:opacity-70"
              size="icon"
              variant={moodId === value ? "default" : "secondary"}
            >
              <ButtonIcon size="lg" as={Icon} />
            </Button>
          );
        })}
      </HStack >
    </HStack >
  );
}
