import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { useAuthStore } from "@/stores/auth-store";
import { Link, Redirect, Stack, usePathname } from "expo-router";
import { Calendar, ChartBar, HomeIcon, PlusIcon, UserIcon } from "lucide-react-native";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Avatar, AvatarFallbackText, AvatarImage } from "@/components/ui/avatar";
import NavLinkButton from "./_components/nav-link-button";

export default function HomeLayout() {
  const { bottom, top } = useSafeAreaInsets()
  const currentPath = usePathname()

  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/" />;
  }

  return (
    <VStack className="flex-1">
      <HStack space="md" className={`${currentPath.includes("/home/new-post") ? "hidden" : "flex"} items-center justify-between bg-white p-5`} style={{ paddingTop: top, }}>
        <HStack className="items-center" space="md">
          <Avatar className="">
            <AvatarImage />
            <AvatarFallbackText className="text-2xl ">{user?.firstName}</AvatarFallbackText>
          </Avatar>
          <View>
            <Text className="text-base font-semibold text-foreground">
              {user?.firstName}
            </Text>
            <Text className="text-gray-500 text-sm">
              @{user?.username}
            </Text>
          </View>
        </HStack>

        <Link href="/home/new-post" asChild>
          <Button size="icon" className="rounded-full p-3" variant="tertiary">
            <ButtonText>
              <PlusIcon color="white" size={16} />
            </ButtonText>
          </Button>
        </Link>
      </HStack>
      <Stack screenOptions={{ headerShown: false, animation: "none" }} />
      <HStack className={`${currentPath.includes("/home/new-post") ? "hidden" : "flex"} bg-white py-5 px-4 w-full justify-around`} style={{ paddingBottom: bottom }}>
        <NavLinkButton Icon={HomeIcon} path="/home">
          Feed
        </NavLinkButton>
        <NavLinkButton Icon={Calendar} path="/history">
          Histórico
        </NavLinkButton>
        <NavLinkButton Icon={ChartBar} path="/statistics">
          Estatísticas
        </NavLinkButton>
        <NavLinkButton Icon={UserIcon} path="/profile">
          Meu Kiga
        </NavLinkButton>
      </HStack>
    </VStack>
  )
}
