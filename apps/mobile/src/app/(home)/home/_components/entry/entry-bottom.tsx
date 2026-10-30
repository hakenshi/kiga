import { HStack } from "@/components/ui/hstack";
import { HeartIcon, MessageCircle, RefreshCcw } from "lucide-react-native";
import { Pressable } from "react-native";

export default function EntryBottom() {
  return (
    <HStack space="md" className="p-3">
      <Pressable>
        <MessageCircle size={16} />
      </Pressable>
      <Pressable>
        <RefreshCcw size={16} />
      </Pressable>
      <Pressable>
        <HeartIcon size={16} />
      </Pressable>
    </HStack>
  )
}
