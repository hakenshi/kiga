import { X } from "lucide-react-native";
import { View, Pressable } from "react-native";

interface CloseButtonProps {
  close: VoidFunction
}

export default function CloseButton({ close }: CloseButtonProps) {
  return (

    <View className="min-w-10 items-start justify-center">
      <Pressable
        onPress={close}
        className="w-10 h-10 rounded-full items-center justify-center active:bg-gray-100"
        hitSlop={8}
      >
        <X size={22} color="#16181D" />
      </Pressable>
    </View>
  )
}
