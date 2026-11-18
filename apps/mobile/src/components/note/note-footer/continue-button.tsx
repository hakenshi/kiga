import { CornerDownRight } from "lucide-react-native";
import { Pressable, PressableProps, Text } from "react-native";

export default function ContinueButton({ ...rest }: PressableProps) {

  return (
    <Pressable
      hitSlop={8}
      className="flex-row items-center bg-zinc-100 py-2 px-4 rounded-full gap-1.5 active:opacity-60"
      {...rest}
    >
      <CornerDownRight size={12} color="black" />
      <Text className="text-xs text-black font-semibold">Continuar</Text>
    </Pressable>
  );
}
