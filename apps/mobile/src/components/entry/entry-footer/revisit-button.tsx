import { RefreshCcw } from "lucide-react-native";
import { Pressable, PressableProps, Text } from "react-native";

export default function RevisitButton({ onPress, ...rest }: PressableProps) {
  return (
    <Pressable
      hitSlop={8}
      onPress={onPress}
      className="flex-row items-center bg-zinc-100 py-2 px-4 rounded-full gap-1.5 active:opacity-60"
      {...rest}
    >
      <RefreshCcw size={12} color="black" />
      <Text className="text-xs text-black font-semibold">
        Revisitar
      </Text>
    </Pressable>
  )
}
