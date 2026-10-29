import { Avatar, AvatarFallbackText, AvatarImage } from "@/components/ui/avatar";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { TEXT_DATA } from "@/lib/text-data";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "expo-router";
import {
  Activity,
  Brain,
  Drama,
  Image as ImageIcon,
  X,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { Text, TextInput } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NavButton from "../../_components/nav-button";
import {
  Drawer,
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
} from "@/components/ui/drawer";

function EmotionsDrawer() {
  const [open, setOpen] = useState(true);

  return (
    <>
      <NavButton Icon={Drama} onPress={() => setOpen(true)}>
        Emoções
      </NavButton>

      <Drawer
        isOpen={open}
        onClose={() => setOpen(false)}
        anchor="bottom"
        size="md"
      >
        <DrawerBackdrop />
        <DrawerContent className=" bg-white rounded-t-3xl">
          <DrawerHeader className="border-gray-100 pb-3">
            <Text className="text-lg font-semibold text-[#16181D]">
              O que você está sentindo?
            </Text>
            <DrawerCloseButton>
              <X size={20} color="#16181D" />
            </DrawerCloseButton>

          </DrawerHeader>

          <DrawerBody className="py-4">
            <Text className="text-gray-500 text-sm">
              Drawer de Emoções configurado! Funciona abrindo por baixo e fechando ao tocar no backdrop ou no X.
            </Text>
          </DrawerBody>
        </DrawerContent>
      </Drawer >
    </>
  );
}

export default function NewPostPage() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const { user } = useAuthStore();

  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const clock = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(clock);
  }, []);

  const weekday = time
    .toLocaleDateString("pt-BR", { weekday: "long" })
    .replace("-feira", "");
  const dayAndMonth = time.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
  });
  const formattedDate = `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${dayAndMonth}`;
  const formattedTime = time.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <VStack className="flex-1 bg-white" style={{ paddingBottom: bottom }}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        {/* Header */}
        <HStack
          className="px-4 py-3 justify-between items-center border-b border-gray-200"
          style={{ paddingTop: top }}
        >
          <Button
            onPress={() => router.push("/(home)/home")}
            variant="ghost"
            className="shadow-none p-1"
          >
            <X size={20} color="black" />
          </Button>

          <VStack className="items-center">
            <Text className="font-semibold text-sm text-[#16181D]">
              {formattedDate}
            </Text>
            <Text className="text-xs text-[#5A606B]">
              {formattedTime}
            </Text>
          </VStack>

          <Button size="sm" className="px-10 rounded-full">
            <ButtonText>Salvar</ButtonText>
          </Button>
        </HStack>

        {/* Conteúdo Principal */}
        <HStack className="flex-1 p-5 items-start overflow-hidden" space="md">
          <Avatar>
            <AvatarImage />
            <AvatarFallbackText>{user?.firstName}</AvatarFallbackText>
          </Avatar>
          <VStack className="flex-1">
            <TextInput
              defaultValue={TEXT_DATA}
              className="flex-1 h-full p-0 text-base"
              style={{
                flex: 1,
                height: "100%",
                textAlignVertical: "top",
              }}
              multiline
              scrollEnabled
            />
          </VStack>
        </HStack>

        {/* Bottom Toolbar */}
        <HStack className="bg-white px-3 py-1 border-t border-gray-200 items-center justify-around w-full">
          <EmotionsDrawer />

          <NavButton Icon={Brain} onPress={() => { }}>
            Pensamentos
          </NavButton>

          <NavButton Icon={Activity} onPress={() => { }}>
            Reações
          </NavButton>

          <NavButton Icon={ImageIcon} onPress={() => { }}>
            Foto
          </NavButton>
        </HStack>
      </KeyboardAvoidingView>
    </VStack>
  );
}
