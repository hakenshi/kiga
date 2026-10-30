import { Avatar, AvatarFallback, AvatarFallbackText, AvatarImage } from "@/components/ui/avatar"
import { HStack } from "@/components/ui/hstack"
import { VStack } from "@/components/ui/vstack"
import { useAuthStore } from "@/stores/auth-store"
import { EllipsisVerticalIcon } from "lucide-react-native"
import { Pressable, Text } from "react-native"

export default function EntryHeader() {
  const { user } = useAuthStore()
  return (
    <HStack className="justify-between" space="lg">
      <HStack space="md">
        <Avatar>
          <AvatarImage />
          <AvatarFallback>
            <AvatarFallbackText>
              {user?.firstName}
            </AvatarFallbackText>
          </AvatarFallback>
        </Avatar>
        <VStack>
          <Text className="text-sm font-semibold">
            {user?.firstName} {user?.secondName}
          </Text>
          <Text className="text-sm text-gray-500">
            @{user?.username}
          </Text>
        </VStack>
      </HStack>
      <Pressable>
        <EllipsisVerticalIcon size={16} color="gray" />
      </Pressable>
    </HStack>
  )
}
