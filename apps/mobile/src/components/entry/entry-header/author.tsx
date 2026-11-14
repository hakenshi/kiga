import { Avatar, AvatarFallbackText } from "@/components/ui/avatar";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { useAuthStore } from "@/stores/auth-store";
import { Text } from "react-native";

export default function Author() {
  const user = useAuthStore(e => e.user)
  return (
    <HStack space="sm" className="items-center flex-1 pr-2">
      <Avatar className="bg-[#F4F4F5] border border-[#E6E8EC]">
        <AvatarFallbackText className="text-[#111318] font-heading">
          {user?.firstName?.charAt(0) || "U"}
        </AvatarFallbackText>
      </Avatar>
      <VStack className="flex-1">
        <HStack className="items-center gap-1.5 flex-wrap">
          <Text
            className="text-[15px] font-heading text-[#111318]"
            numberOfLines={1}
          >
            {`${user?.firstName ?? ""} ${user?.secondName ?? ""}`.trim() || "Você"}
          </Text>
        </HStack>
        <HStack className="items-center" space="xs">
          {user?.username ? (
            <Text className="text-[13px] font-subtitle text-[#68707C]">
              @{user.username}
            </Text>
          ) : null}
        </HStack>
      </VStack>
    </HStack>


  )
}
