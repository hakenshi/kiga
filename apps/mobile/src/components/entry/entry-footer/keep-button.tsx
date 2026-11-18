import { useNoteStore } from "@/stores/note-store";
import { HeartIcon } from "lucide-react-native";
import { Pressable, PressableProps, Text } from "react-native";

interface Props extends PressableProps {
  entryId: number
  liked: boolean
}

export default function KeepButton({ entryId, liked, ...rest }: Props) {

  const updateNote = useNoteStore((s) => s.updateNote);

  const likeEntry = () => {
    updateNote(entryId, { liked: !liked });
  };

  return (
    <Pressable
      hitSlop={8}
      onPress={likeEntry}
      className="flex-row items-center bg-zinc-100 py-2 px-4 rounded-full gap-1.5 active:opacity-60"
      {...rest}
    >
      <HeartIcon
        fill={liked ? "#EF4444" : "none"}
        strokeWidth={liked ? 0 : 2}
        size={12}
        color={liked ? "#EF4444" : "#68707C"}
      />
      <Text className="text-xs text-black font-semibold">
        {liked ? "Remover" : "Guardar"}
      </Text>
    </Pressable>
  )
}
