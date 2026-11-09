import { Button, ButtonGroup, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField, InputIcon } from "@/components/ui/input";
import { VStack } from "@/components/ui/vstack";
import { useAuthStore } from "@/stores/auth-store";
import { useEntryStore } from "@/stores/journal-store";
import { eachDayOfInterval, endOfWeek, format, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, ChevronDownIcon, SearchIcon } from "lucide-react-native";
import { Pressable, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import EntryList from "@/components/entry/entry-list";
import { useState } from "react";

export default function HistoryPage() {
  const user = useAuthStore((s) => s.user);
  const { top } = useSafeAreaInsets();

  const userEntries = useEntryStore(e => e.entries)

  const [today] = useState(() => new Date())

  const month = format(today, "MMMM", { locale: ptBR });
  const year = format(today, "yyyy", { locale: ptBR })
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(today, { weekStartsOn: 0 })

  const dateInterval = eachDayOfInterval({ end: weekEnd, start: weekStart })



  return (
    <>
      <VStack space="md" className="p-5 bg-white">
        <HStack className="justify-between items-center">
          <VStack>
            <Text className="text-lg font-bold">
              Esta Semana - {format(weekStart, "d", { locale: ptBR })} a {format(weekEnd, "d", { locale: ptBR })}
            </Text>
            <Text className="capitalize text-xs px-0">
              {month} {year}
            </Text>
          </VStack>
          <HStack className="bg-zinc-300 px-3 justify-center items-center rounded-full">
            <Text className="text-sm font-bold py-1">
              {userEntries.length} Registros - Humor: Bom
            </Text>
          </HStack>
        </HStack>
        <HStack className="items-center w-full" space="sm">
          <Input className="flex-1">
            <InputIcon as={SearchIcon} />
            <InputField />
          </Input>
          <Pressable className="flex-row gap-2 items-center justify-center bg-zinc-400 mih-h-9 px-3">
            <CalendarIcon size={16} />
            <ChevronDownIcon size={16} />
          </Pressable>
        </HStack>
        <ButtonGroup>
          {Array.from({ length: 4 }).map((item, i) => (
            <Button key={i} size="md">
              <ButtonText>
                Semana {i + 1}
              </ButtonText>
            </Button>
          ))}
        </ButtonGroup>
        <HStack>
          <Pressable className="flex-col py-2">
            <Text className="text-xs text-zinc-300">
              Sem.
            </Text>
            <Text className="text-sm">
              Toda
            </Text>
          </Pressable>
          {dateInterval.map((item, i) => (
            <Pressable key={i} className="flex-col py-2">
              <Text className="text-xs text-zinc-300 capitalize" >
                {format(item, "EEE", { locale: ptBR }).slice(0, 3)}
              </Text>
              <Text className="text-sm capitalize">
                {format(item, "d", { locale: ptBR })}
              </Text>
            </Pressable>
          ))}
        </HStack>
      </VStack >
      <EntryList entries={userEntries} />
    </>
  );
}
