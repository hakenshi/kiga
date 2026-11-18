import { Avatar, AvatarFallbackText } from "@/components/ui/avatar";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { useAuthStore } from "@/stores/auth-store";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Text } from "react-native";
import { useNote } from "../note-context";
export default function Author() {
  const user = useAuthStore(e => e.user)
  const { note } = useNote()


  return (
    <HStack space="sm" className="items-center flex-1 pr-2">
      <Avatar className="bg-zinc-100 border border-gray-200">
        <AvatarFallbackText className="text-zinc-900 font-heading">
          {user?.firstName?.charAt(0) || "U"}
        </AvatarFallbackText>
      </Avatar>
      <VStack className="flex-1 justify-center">
        <HStack className="items-center gap-1.5 flex-wrap">
          <Text
            className="text-base font-heading text-zinc-900"
            numberOfLines={1}
          >
            {user?.firstName} {user?.secondName}
          </Text>
          <Text className="text-sm capitalize text-center font-subtitle text-gray-500">
            {format(note.date, "MMM dd", { locale: ptBR })}

          </Text>
        </HStack>
        <HStack className="items-center" space="xs">
          <Text className="text-sm font-subtitle text-gray-500">
            @{user?.username}
          </Text>
        </HStack>
      </VStack>
    </HStack>
  )
}
