import { HStack } from "@/components/ui/hstack";
import { RefreshCcw } from "lucide-react-native";
import { Text } from "react-native";

export default function Repost() {
  return (
    <HStack className="items-center gap-1.5 pb-0.5">
      <RefreshCcw size={12} color="#71717A" />
      <Text className="text-xs font-subtitle-medium text-zinc-500">
        Revisitou uma nota
      </Text>
    </HStack>
  )
}
