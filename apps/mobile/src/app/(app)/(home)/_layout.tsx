import Logo from "@/components/common/logo";
import { eachDayOfInterval, eachWeekOfInterval, endOfMonth, endOfWeek, format, getDate, getWeeksInMonth, isSameWeek, isThisWeek, startOfMonth, startOfWeek } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button, ButtonGroup, ButtonIcon, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField, InputIcon } from "@/components/ui/input";
import { VStack } from "@/components/ui/vstack";
import { Tabs, usePathname } from "expo-router";
import { CalendarIcon, ChartBar, ChevronDown, HomeIcon, SearchIcon, SettingsIcon, SlidersHorizontalIcon, UserIcon } from "lucide-react-native";
import { use, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Drawer, DrawerBackdrop, DrawerBody, DrawerCloseButton, DrawerContent, DrawerHeader } from "@/components/ui/drawer";
import { useFeedFilterStore } from "@/stores/feed-filter-store";

const TABS = [
  { name: "home/index", path: "/home", label: "Feed", icon: HomeIcon },
  { name: "statistics/index", path: "/statistics", label: "Estatísticas", icon: ChartBar },
  { name: "settings/index", path: "/settings", label: "Configurações", icon: SettingsIcon },
  { name: "profile/index", path: "/profile", label: "Meu Kiga", icon: UserIcon },
] as const;

export default function HomeLayout() {
  const { bottom } = useSafeAreaInsets();
  const currentPath = usePathname();
  const [hidden, setHidden] = useState(false)
  const [date] = useState(() => new Date())

  const [weekDrawerOpen, setWeekDrawerOpen] = useState(false)

  const weekDaysStart = useFeedFilterStore(f => f.start)
  const weekDaysEnd = useFeedFilterStore(f => f.end)
  const weekDaysInterval = useFeedFilterStore(f => f.interval)
  const weekDaysCurrent = useFeedFilterStore(f => f.current)
  const query = useFeedFilterStore(f => f.query)
  const updateWeekDaysCurrent = useFeedFilterStore(f => f.updateCurrent)
  const updateQuery = useFeedFilterStore(f => f.updateQuery)
  const monthWeeks = eachWeekOfInterval({ start: startOfMonth(date), end: endOfMonth(date) }).map(w => {
    const [start, end] = [startOfWeek(w, { weekStartsOn: 0, locale: ptBR }), endOfWeek(w, { locale: ptBR, weekStartsOn: 0 })]

    return {
      value: start.toISOString(),
      label: `${format(start, 'd')} - ${format(end, "d")}`,
      start,
      end,
      interval: eachDayOfInterval({ end, start }),
      isCurrentWeek: isSameWeek(date, start, { locale: ptBR, weekStartsOn: 0 })
    }
  })

  const isComposer = Boolean(currentPath.match(/home\/[a-z0-9_-]+-post/g))



  return (
    <VStack className="flex-1 bg-background">
      <HStack className={`${isComposer ? "hidden" : "flex"} ${hidden && "border-b border-border"} ${hidden ? "p-3" : "px-3 pt-3"} `} space="md">
        <Logo size="sm" />
        {currentPath === "/home" && (
          <>
            <Input className="flex-1">
              <InputIcon as={SearchIcon} />
              <InputField placeholder="Procure um pensamento..." onChangeText={e => updateQuery(e)} />
            </Input>
            <Button onPress={() => setHidden(h => !h)}>
              <ButtonText>
                Filtros
              </ButtonText>
              <ButtonIcon size="lg" as={SlidersHorizontalIcon} />
            </Button>
          </>
        )}
      </HStack>
      {
        !hidden && currentPath === "/home" && (
          <VStack space="md" className="border-b border-border p-3">
            <ButtonGroup className="w-full items-center justify-evenly">
              <Button variant="secondary" size="sm">
                <ButtonIcon as={CalendarIcon} />
                <ButtonText className="font-semibold">
                  {format(weekDaysStart, "MMMM", { locale: ptBR })} {format(weekDaysStart, "yyyy", { locale: ptBR })}
                </ButtonText>
                <ButtonIcon as={ChevronDown} />
              </Button>
              <Button variant="secondary" size="sm" onPress={() => setWeekDrawerOpen(true)} disabled={weekDrawerOpen} >
                <ButtonIcon as={CalendarIcon} />
                <ButtonText className="font-semibold">
                  {isThisWeek(weekDaysStart) ? "Esta Semana" : "Outra Semana"} {getDate(startOfWeek(weekDaysStart))} - {getDate(endOfWeek(weekDaysEnd))}
                </ButtonText>
                <ButtonIcon as={ChevronDown} />
              </Button>
            </ButtonGroup>
            <ButtonGroup className="justify-center" space="md">
              {weekDaysInterval.map((wd, i) => (
                <Button key={i} size="sm" variant={weekDaysCurrent !== null && getDate(wd) === getDate(weekDaysCurrent) ? "default" : "secondary"} onPress={() => updateWeekDaysCurrent(wd)} className="flex-col">
                  <ButtonText>
                    {format(wd, "EEE", { locale: ptBR }).slice(0, 3)}
                  </ButtonText>
                  <ButtonText>
                    {getDate(wd)}
                  </ButtonText>
                </Button>
              ))}
            </ButtonGroup>
            <Drawer isOpen={weekDrawerOpen} onClose={() => setWeekDrawerOpen(false)} anchor="bottom">
              <DrawerBackdrop />
              <DrawerContent className="bg-white">
                <DrawerHeader>
                  <DrawerCloseButton />
                </DrawerHeader>
                <DrawerBody>
                  <VStack space="md">
                    {monthWeeks.map((mw, i) => (
                      <Button onPress={() => {
                        useFeedFilterStore.setState(mw)
                        setWeekDrawerOpen(false)
                      }} key={i}>
                        <ButtonText>
                          Semana {mw.label}
                        </ButtonText>
                      </Button>
                    ))}
                  </VStack>
                </DrawerBody>
              </DrawerContent>
            </Drawer>
          </VStack>
        )
      }
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
        <Tabs.Screen name="settings/index" options={{ title: "Configurações" }} />
        <Tabs.Screen name="statistics/index" options={{ title: "Estatísticas" }} />
        <Tabs.Screen name="profile/index" options={{ title: "Meu Kiga" }} />
        <Tabs.Screen
          name="home/(composer)"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </VStack >
  );
}
