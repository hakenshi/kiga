import { useMutation, useQueryClient } from "@tanstack/react-query";
import { noteMutations } from "@/queries/notes/queries";
import { HeartIcon } from "lucide-react-native";
import { Pressable, Text, type PressableProps } from "react-native";
import { useNote } from "../note-context";

export default function KeepButton(rest: PressableProps) {
  const { note: { id: noteId, userId, liked } } = useNote();
  const client = useQueryClient();
  const update = useMutation(noteMutations.update(client, userId));
  const likeNote = () => {
    update.mutate({ noteId, data: { liked: !liked } });
  };

  return (
    <Pressable
      hitSlop={8}
      onPress={likeNote}
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
  );
}
