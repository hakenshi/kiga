import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { SessionState, useAuthStore } from "@/stores/auth-store";
import { Link, Redirect, Stack, usePathname } from "expo-router";
import { getStoredItem } from "@/lib/utils";
import { Calendar, ChartBar, HomeIcon, UserIcon } from "lucide-react-native";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Avatar, AvatarFallbackText, AvatarImage } from "@/components/ui/avatar";

export default function HomeLayout() {
  const { bottom, top } = useSafeAreaInsets()
  const currentPath = usePathname()

  const { isAuthenticated, user } = useAuthStore()

  const session = getStoredItem<SessionState>("session");

  if (!isAuthenticated && !session?.isAuthenticated) {
    return <Redirect href="/" />;
  }

  return (
    <VStack className="flex-1">
      <HStack space="md" className="items-center bg-white p-5" style={{ paddingTop: top, }}>
        <Avatar className="">
          <AvatarImage />
          <AvatarFallbackText className="text-2xl ">{user?.firstName}</AvatarFallbackText>
        </Avatar>
        <VStack className="pl-2">
          <Text className="text-2xl font-jakarta">
            {user?.firstName}
          </Text>
          <Text className="text-zinc-600">
            @{user?.username}
          </Text>
        </VStack>
        <DotIcon
      </HStack>
      <View className="flex-1 px-5 py-2">
        <Stack screenOptions={{ headerShown: false }} />
      </View>
      <HStack className="bg-white py-5 px-4 w-full justify-around" style={{ paddingBottom: bottom }}>
        <Link href="/home" asChild>
          <Button variant={currentPath.includes("/home") ? "navgiation" : "ghost"} className="px-8 py-2 flex-col shadow-none">
            <HomeIcon color={currentPath.includes("/home") ? "#0084D1" : "black"} />
            <ButtonText className={currentPath.includes("/home") ? "text-sky-600" : "text-gray-500"}>
              Feed
            </ButtonText>
          </Button>
        </Link>
        <Link href="/history" asChild>
          <Button variant={currentPath.includes("/history") ? "navgiation" : "ghost"} className="flex-col shadow-none px-4">
            <Calendar color={currentPath.includes("/history") ? "#0084D1" : "black"} />
            <ButtonText className={currentPath.includes("/history") ? "text-sky-600" : "text-gray-500"}>
              Histórico
            </ButtonText>
          </Button>
        </Link>
        <Link href="/statistics" asChild>
          <Button variant={currentPath.includes("/statistics") ? "navgiation" : "ghost"} className="flex-col shadow-none px-4">
            <ChartBar color={currentPath.includes("/statistics") ? "#0084D1" : "black"} />
            <ButtonText className={currentPath.includes("/statistics") ? "text-sky-600" : "text-gray-500"}>
              Estatísticas
            </ButtonText>
          </Button>
        </Link>
        <Link href="/profile" asChild>
          <Button variant={currentPath.includes("/profile") ? "navgiation" : "ghost"} className="flex-col shadow-none px-4">
            <UserIcon color={currentPath.includes("/profile") ? "#0084D1" : "black"} />
            <ButtonText className={currentPath.includes("/profile") ? "text-sky-600" : "text-gray-500"}>
              Meu Kiga
            </ButtonText>
          </Button>
        </Link>
      </HStack>
    </VStack >
  )
}
