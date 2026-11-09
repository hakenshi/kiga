import Logo from "@/components/common/logo";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { useAuthStore } from "@/stores/auth-store";
import { Redirect, Tabs, usePathname } from "expo-router";
import { Calendar, ChartBar, HomeIcon, UserIcon } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TABS = [
  { name: "home/index", path: "/home", label: "Feed", icon: HomeIcon },
  { name: "history/index", path: "/history", label: "Histórico", icon: Calendar },
  { name: "statistics/index", path: "/statistics", label: "Estatísticas", icon: ChartBar },
  { name: "profile/index", path: "/profile", label: "Meu Kiga", icon: UserIcon },
] as const;

export default function HomeLayout() {
  const { bottom } = useSafeAreaInsets();
  const currentPath = usePathname();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  if (!isAuthenticated || !user) {
    return <Redirect href="/(auth)/login" />;
  }

  const isComposer =
    Boolean(currentPath.match(/home\/[a-z0-9_-]+-post/g)) ||
    currentPath.includes("/home/new-post");

  return (
    <VStack className="flex-1 bg-background">
      <HStack className={`${isComposer ? "hidden" : "flex"} border-b border-border p-3`}>
        <Logo size="sm" />
      </HStack>
      <Tabs
        tabBar={({ state, navigation }) => {
          if (isComposer) {
            return null;
          }

          const currentRouteName = state.routes[state.index]?.name;

          return (
            <HStack
              className="bg-background border-t border-border py-5 px-4 w-full justify-around"
              style={{ paddingBottom: bottom }}
            >
              {TABS.map((tab) => {
                const isFocused = currentRouteName === tab.name || currentPath.startsWith(tab.path);
                const route = state.routes.find((r) => r.name === tab.name);

                const handlePress = () => {
                  const event = route
                    ? navigation.emit({
                      type: "tabPress",
                      target: route.key,
                      canPreventDefault: true,
                    })
                    : undefined;

                  if (!isFocused && !event?.defaultPrevented) {
                    navigation.navigate(tab.name);
                  }
                };

                return (
                  <Pressable
                    key={tab.name}
                    onPress={handlePress}
                    className={`flex-1 items-center justify-center py-2 px-2 rounded-2xl active:opacity-70 ${isFocused ? "bg-secondary" : ""
                      }`}
                  >
                    <View className="w-6 h-6 items-center justify-center">
                      <tab.icon size={20} color={isFocused ? "#18181b" : "#71717a"} />
                    </View>
                    <Text
                      className={`text-[11px] mt-1 ${isFocused
                        ? "text-foreground font-semibold"
                        : "text-muted-foreground font-normal"
                        }`}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </HStack>
          );
        }}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen name="home/index" options={{ title: "Feed" }} />
        <Tabs.Screen name="history/index" options={{ title: "Histórico" }} />
        <Tabs.Screen name="statistics/index" options={{ title: "Estatísticas" }} />
        <Tabs.Screen name="profile/index" options={{ title: "Meu Kiga" }} />
        <Tabs.Screen
          name="home/new-post/index"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </VStack>
  );
}
