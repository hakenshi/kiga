import { Button } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { SessionState, useAuthStore } from "@/stores/auth-store";
import { Link, Redirect, Stack, usePathname } from "expo-router";
import { getStoredItem } from "@/lib/utils";
import { Calendar, ChartBar, HomeIcon, UserIcon } from "lucide-react-native";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context"

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
      <HStack className="bg-white p-5" style={{ paddingTop: top, }}>
        <Text>
          {user?.username}
        </Text>
      </HStack>
      <View className="flex-1 px-5 py-2">
        <Stack screenOptions={{ headerShown: false }} />
      </View>
      <HStack className="bg-white py-5 px-2 w-full justify-between" style={{ paddingBottom: bottom }}>
        <Link href="/home" asChild>
          <Button variant={currentPath.includes("/home") ? "default" : "ghost"} className="flex-col shadow-none">
            <HomeIcon color={currentPath.includes("/home") ? "white" : "black"} />
          </Button>
        </Link>
        <Link href="/history" asChild>
          <Button variant={currentPath.includes("/history") ? "default" : "ghost"} className="flex-col shadow-none">
            <Calendar color={currentPath.includes("/history") ? "white" : "black"} />
          </Button>
        </Link>
        <Link href="/statistics" asChild>
          <Button variant={currentPath.includes("/statistics") ? "default" : "ghost"} className="flex-col shadow-none">
            <ChartBar color={currentPath.includes("/statistics") ? "white" : "black"} />
          </Button>
        </Link>
        <Link href="/profile" asChild>
          <Button variant={currentPath.includes("/profile") ? "default" : "ghost"} className="flex-col shadow-none">
            <UserIcon color={currentPath.includes("/profile") ? "white" : "black"} />
          </Button>
        </Link>
      </HStack>
    </VStack >
  )
}
