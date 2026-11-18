import { useRouter } from "expo-router";
import { CornerDownRight } from "lucide-react-native";
import { Pressable, PressableProps, Text } from "react-native";

interface Props extends PressableProps {
  entryId: number;
}

export default function ContinueButton({ entryId, ...rest }: Props) {
  const router = useRouter();

  return (
    <Pressable
      hitSlop={8}
      onPress={() => router.push(`/home/reply-note/${entryId}`)}
      className="flex-row items-center bg-zinc-100 py-2 px-4 rounded-full gap-1.5 active:opacity-60"
      {...rest}
    >
      <CornerDownRight size={12} color="black" />
      <Text className="text-xs text-black font-semibold">Continuar</Text>
    </Pressable>
  );
}
