import Logo from "@/components/common/logo";
import { Button, ButtonGroup, ButtonIcon, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField, InputIcon } from "@/components/ui/input";
import { VStack } from "@/components/ui/vstack";
import { Tabs, usePathname } from "expo-router";
import { CalendarIcon, ChartBar, Check, ChevronDown, HomeIcon, SearchIcon, SettingsIcon, SlidersHorizontalIcon, UserIcon, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { AppState, Pressable, Text, View } from "react-native";
import { revalidateNoteCaches } from "@/stores/revalidate-note-caches";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Drawer, DrawerBackdrop, DrawerBody, DrawerCloseButton, DrawerContent, DrawerHeader } from "@/components/ui/drawer";
import { useAuthStore } from "@/stores/auth-store";
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
  const user = useAuthStore(s => s.user);
  const [hidden, setHidden] = useState(true)
  const [yearDrawerOpen, setYearDrawerOpen] = useState(false)
  const [monthDrawerOpen, setMonthDrawerOpen] = useState(false)
  const [weekDrawerOpen, setWeekDrawerOpen] = useState(false)

  const yearLabel = useFeedFilterStore(f => f.yearLabel)
  const monthLabel = useFeedFilterStore(f => f.monthLabel)
  const weekLabel = useFeedFilterStore(f => f.weekLabel)
  const years = useFeedFilterStore(f => f.years)
  const months = useFeedFilterStore(f => f.months)
  const weeks = useFeedFilterStore(f => f.weeks)
  const days = useFeedFilterStore(f => f.days)
  const syncFilters = useFeedFilterStore(f => f.sync)
  const selectYear = useFeedFilterStore(f => f.selectYear)
  const selectMonth = useFeedFilterStore(f => f.selectMonth)
  const selectWeek = useFeedFilterStore(f => f.selectWeek)
  const updateWeekDaysCurrent = useFeedFilterStore(f => f.updateCurrent)
  const updateQuery = useFeedFilterStore(f => f.updateQuery)
  const resetFilters = useFeedFilterStore(f => f.reset)
  const activeFilterLabel = useFeedFilterStore(f => f.activeFilterLabel)

  useEffect(() => {
    revalidateNoteCaches();
    syncFilters(user?.id, user?.createdAt);
    const subscription = AppState.addEventListener("change", state => {
      if (state === "active") {
        revalidateNoteCaches();
        syncFilters(user?.id, user?.createdAt);
      }
    });
    return () => subscription.remove();
  }, [currentPath, syncFilters, user?.createdAt, user?.id]);

  const isComposer = Boolean(currentPath.match(/home\/[a-z0-9_-]+-note/g))


  return (
    <VStack className="flex-1 bg-background">
      <HStack className={`${isComposer ? "hidden" : "flex"} ${hidden && "border-b border-border"} ${hidden ? "p-3" : "px-3 pt-3"} `} space="md">
        <Logo size="sm" />
        {currentPath === "/home" && (
          <>
            <Input className="flex-1">
              <InputIcon as={SearchIcon} />
              <InputField placeholder="Procure uma nota..." onChangeText={e => updateQuery(e)} />
            </Input>
            <Button onPress={() => {
              syncFilters(user?.id, user?.createdAt)
              setHidden(h => !h)
            }}>
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
              <Button
                variant="secondary"
                size="sm"
                onPress={() => {
                  syncFilters(user?.id, user?.createdAt)
                  setYearDrawerOpen(true)
                }}
                disabled={yearDrawerOpen}
              >
                <ButtonIcon as={CalendarIcon} />
                <ButtonText className="font-semibold">
                  {yearLabel}
                </ButtonText>
                <ButtonIcon as={ChevronDown} />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onPress={() => {
                  syncFilters(user?.id, user?.createdAt)
                  setMonthDrawerOpen(true)
                }}
                disabled={monthDrawerOpen}
              >
                <ButtonIcon as={CalendarIcon} />
                <ButtonText className="font-semibold">
                  {monthLabel}
                </ButtonText>
                <ButtonIcon as={ChevronDown} />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onPress={() => {
                  syncFilters(user?.id, user?.createdAt)
                  setWeekDrawerOpen(true)
                }}
                disabled={weekDrawerOpen}
              >
                <ButtonIcon as={CalendarIcon} />
                <ButtonText className="font-semibold">
                  {weekLabel}
                </ButtonText>
                <ButtonIcon as={ChevronDown} />
              </Button>
            </ButtonGroup>
            <ButtonGroup className="justify-center" space="md">
              {days.map((day) => (
                <Button
                  key={day.value}
                  size="sm"
                  variant={day.isSelected ? "default" : "secondary"}
                  disabled={day.disabled}
                  onPress={() => updateWeekDaysCurrent(day.date)}
                  className={`flex-col ${day.disabled ? "opacity-40" : ""}`}
                >
                  <ButtonText>
                    {day.dayName}
                  </ButtonText>
                  <ButtonText>
                    {day.dayNumber}
                  </ButtonText>
                </Button>
              ))}
            </ButtonGroup>
            {activeFilterLabel && (
              <HStack className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 items-center justify-between">
                <Text className="text-xs font-subtitle-medium text-zinc-600">
                  {activeFilterLabel}
                </Text>
                <Pressable
                  onPress={resetFilters}
                  hitSlop={8}
                  className="flex-row items-center gap-1 active:opacity-70"
                >
                  <X size={13} color="#18181B" />
                  <Text className="text-xs font-subtitle-semibold text-zinc-900">
                    Ver todos
                  </Text>
                </Pressable>
              </HStack>
            )}

            <Drawer isOpen={yearDrawerOpen} onClose={() => setYearDrawerOpen(false)} anchor="bottom" size="sm">
              <DrawerBackdrop />
              <DrawerContent className="bg-white rounded-t-3xl pb-6 h-auto">
                <View className="w-full items-center pb-2">
                  <View className="w-10 h-1 rounded-full bg-zinc-300" />
                </View>
                <DrawerHeader className="border-b border-zinc-100 pb-3">
                  <VStack className="flex-1">
                    <Text className="text-base font-heading text-zinc-900">
                      Selecionar ano
                    </Text>
                    <Text className="text-xs font-subtitle text-zinc-500">
                      Apenas anos desde a criação da sua conta
                    </Text>
                  </VStack>
                  <DrawerCloseButton className="w-8 h-8 rounded-full bg-zinc-100 items-center justify-center p-0">
                    <X size={16} color="#52525B" />
                  </DrawerCloseButton>
                </DrawerHeader>
                <DrawerBody className="mt-3 mb-0">
                  <View className="flex-row flex-wrap gap-2.5">
                    {years.map((y) => (
                      <Pressable
                        key={y.value}
                        disabled={y.disabled}
                        onPress={() => {
                          selectYear(y.date)
                          setYearDrawerOpen(false)
                        }}
                        className={`flex-1 min-w-[30%] h-18 rounded-2xl p-3 border justify-between ${y.isSelected
                          ? "bg-zinc-900 border-zinc-900"
                          : y.disabled
                            ? "bg-zinc-100/60 border-zinc-100 opacity-50"
                            : "bg-zinc-50 border-zinc-200 active:bg-zinc-100"
                          }`}
                      >
                        <HStack className="justify-between items-center">
                          <Text className={`text-base font-heading ${y.isSelected ? "text-white" : y.disabled ? "text-zinc-400" : "text-zinc-900"}`}>
                            {y.label}
                          </Text>
                          {y.isSelected && <Check size={15} color="#FFFFFF" />}
                        </HStack>
                        <Text className={`text-[11px] font-subtitle ${y.isSelected ? "text-zinc-400" : y.disabled ? "text-zinc-300" : "text-zinc-500"}`}>
                          {y.subtitle}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </DrawerBody>
              </DrawerContent>
            </Drawer>

            <Drawer isOpen={monthDrawerOpen} onClose={() => setMonthDrawerOpen(false)} anchor="bottom" size="md">
              <DrawerBackdrop />
              <DrawerContent className="bg-white rounded-t-3xl pb-6 h-auto">
                <View className="w-full items-center pb-2">
                  <View className="w-10 h-1 rounded-full bg-zinc-300" />
                </View>
                <DrawerHeader className="border-b border-zinc-100 pb-3">
                  <VStack className="flex-1">
                    <Text className="text-base font-heading text-zinc-900">
                      Selecionar mês
                    </Text>
                    <Text className="text-xs font-subtitle text-zinc-500">
                      {yearLabel} • Meses futuros ou sem notas ficam bloqueados
                    </Text>
                  </VStack>
                  <DrawerCloseButton className="w-8 h-8 rounded-full bg-zinc-100 items-center justify-center p-0">
                    <X size={16} color="#52525B" />
                  </DrawerCloseButton>
                </DrawerHeader>
                <DrawerBody className="mt-3 mb-0">
                  <View className="flex-row flex-wrap gap-2.5">
                    {months.map((m) => (
                      <Pressable
                        key={m.value}
                        disabled={m.disabled}
                        onPress={() => {
                          selectMonth(m.date)
                          setMonthDrawerOpen(false)
                        }}
                        className={`w-[31%] h-15 rounded-2xl px-2.5 border items-center justify-center gap-0.5 ${m.isSelected
                          ? "bg-zinc-900 border-zinc-900"
                          : m.disabled
                            ? "bg-zinc-100/60 border-zinc-100"
                            : "bg-zinc-50 border-zinc-200 active:bg-zinc-100"
                          }`}
                      >
                        <HStack className="items-center gap-1">
                          <Text className={`text-xs font-subtitle-semibold ${m.isSelected ? "text-white" : m.disabled ? "text-zinc-300" : "text-zinc-900"}`}>
                            {m.label}
                          </Text>
                          {m.isSelected && <Check size={12} color="#FFFFFF" />}
                        </HStack>
                        <Text className={`text-[10px] font-subtitle ${m.isSelected ? "text-zinc-400" : m.disabled ? "text-zinc-300" : "text-zinc-500"}`}>
                          {m.subtitle}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </DrawerBody>
              </DrawerContent>
            </Drawer>

            <Drawer isOpen={weekDrawerOpen} onClose={() => setWeekDrawerOpen(false)} anchor="bottom" size="md">
              <DrawerBackdrop />
              <DrawerContent className="bg-white rounded-t-3xl pb-6 h-auto">
                <View className="w-full items-center pb-2">
                  <View className="w-10 h-1 rounded-full bg-zinc-300" />
                </View>
                <DrawerHeader className="border-b border-zinc-100 pb-3">
                  <VStack className="flex-1">
                    <Text className="text-base font-heading text-zinc-900">
                      Selecionar semana
                    </Text>
                    <Text className="text-xs font-subtitle text-zinc-500">
                      {monthLabel} de {yearLabel} • Apenas semanas até hoje
                    </Text>
                  </VStack>
                  <DrawerCloseButton className="w-8 h-8 rounded-full bg-zinc-100 items-center justify-center p-0">
                    <X size={16} color="#52525B" />
                  </DrawerCloseButton>
                </DrawerHeader>
                <DrawerBody className="mt-3 mb-0">
                  <VStack space="sm">
                    {weeks.map((mw) => (
                      <Pressable
                        key={mw.value}
                        disabled={mw.disabled}
                        onPress={() => {
                          selectWeek(mw.start, mw.end)
                          setWeekDrawerOpen(false)
                        }}
                        className={`flex-row items-center justify-between px-3.5 py-3 rounded-2xl border ${mw.isSelected
                          ? "bg-zinc-900 border-zinc-900"
                          : mw.disabled
                            ? "bg-zinc-100/60 border-zinc-100"
                            : "bg-zinc-50 border-zinc-200 active:bg-zinc-100"
                          }`}
                      >
                        <HStack className="items-center gap-3 flex-1">
                          <View
                            className={`w-8 h-8 rounded-xl border items-center justify-center ${mw.isSelected
                              ? "bg-zinc-800 border-zinc-700"
                              : mw.disabled
                                ? "bg-zinc-100 border-zinc-200"
                                : "bg-white border-zinc-200"
                              }`}
                          >
                            <Text className={`text-[11px] font-heading ${mw.isSelected ? "text-white" : mw.disabled ? "text-zinc-300" : "text-zinc-900"}`}>
                              {mw.indexLabel}
                            </Text>
                          </View>
                          <VStack className="flex-1">
                            <Text className={`text-xs font-subtitle-semibold ${mw.isSelected ? "text-white" : mw.disabled ? "text-zinc-300" : "text-zinc-900"}`}>
                              {mw.title}
                            </Text>
                            <Text className={`text-[11px] font-subtitle ${mw.isSelected ? "text-zinc-400" : mw.disabled ? "text-zinc-300" : "text-zinc-500"}`}>
                              {mw.subtitle}
                            </Text>
                          </VStack>
                        </HStack>
                        <HStack className="items-center gap-2">
                          {mw.isCurrentWeek && (
                            <View className={`px-2 py-0.5 rounded-full ${mw.isSelected ? "bg-zinc-800" : "bg-zinc-200"}`}>
                              <Text className={`text-[10px] font-subtitle-semibold ${mw.isSelected ? "text-white" : "text-zinc-900"}`}>
                                Esta semana
                              </Text>
                            </View>
                          )}
                          {mw.isSelected && <Check size={16} color="#FFFFFF" />}
                        </HStack>
                      </Pressable>
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
                      className={`text-xs mt-1 ${isFocused
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
