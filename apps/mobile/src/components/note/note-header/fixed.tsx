import { HStack } from "@/components/ui/hstack";
import { Pin } from "lucide-react-native";
import { Text } from "react-native";

export default function Fixed() {
  return (
    <HStack className="justify-end" space="xs">
      <Pin size={14} color={"#99a1af"} />
      <Text className="font-semibold text-xs text-gray-400">
        Fixado
      </Text>
    </HStack>
  )
}
