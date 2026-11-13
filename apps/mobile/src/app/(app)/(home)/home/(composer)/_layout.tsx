import NavButton from "@/components/common/nav-button";
import BehaviorsDrawer from "@/components/composer/drawers/behaviors-drawer";
import EmotionsDrawer from "@/components/composer/drawers/emotions-drawer";
import ReactionsDrawer from "@/components/composer/drawers/reactions-drawer";
import ThoughtsDrawer from "@/components/composer/drawers/thoughts-drawer";
import ComposerFooter from "@/components/composer/footer";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { countWords } from "@/lib/utils";
import { Slot, useRouter } from "expo-router";
import { ImageIcon, Lock, X } from "lucide-react-native";
import { KeyboardAvoidingView, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Button, ButtonText } from "@/components/ui/button";
import MoodRow from "@/components/composer/mood-row";
import { useEntryCacheStore } from "@/stores/entry-cache-store";

function WordCount() {
  // const wordCount = useComposer((s) => countWords(s.content));
  const wordCount = 1
  return (
    <Text className="text-xs font-subtitle text-[#9AA0AA]">
      {wordCount} {wordCount === 1 ? "palavra" : "palavras"}
    </Text>
  );
}

function PhotoButton() {
  const imageCount = 0

  const updateCachedEntry = useEntryCacheStore(e => e.updateCachedEntry)

  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      const uris = result.assets.map(a => a.uri)
      updateCachedEntry({ entryImages: uris })
    }
  };

  return (
    <NavButton Icon={ImageIcon} badge={imageCount} onPress={pick}>
      Foto
    </NavButton>
  );
}
export default function ComposerLayout() {
  const { bottom, top } = useSafeAreaInsets();
  const title = "thing"
  const router = useRouter()
  const close = () => router.back()
  return (
    <VStack className="flex-1 bg-white" style={{ paddingBottom: bottom }}>
      <VStack style={{ paddingTop: top }} className="bg-white border-b border-gray-100">
        <HStack className="px-4 h-14 justify-between items-center">
          <View className="min-w-[40px] items-start justify-center">
            <Pressable
              onPress={close}
              className="w-10 h-10 rounded-full items-center justify-center active:bg-gray-100"
              hitSlop={8}
            >
              <X size={22} color="#16181D" />
            </Pressable>
          </View>
          <VStack className="items-center justify-center flex-1 px-2">
            <Text>
              {title}
            </Text>
          </VStack>
          <View className="min-w-[40px] items-end justify-center">
            <Button>
              <ButtonText>
                Salvar
              </ButtonText>
            </Button>
          </View>
        </HStack>
        <MoodRow />
      </VStack>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <Slot />

        <VStack className="bg-white border-t border-[#E6E8EC] pt-2 pb-1">
          <HStack className="justify-between px-5 pb-1.5 items-center">
            <WordCount />
            <HStack className="items-center gap-1">
              <Lock size={11} color="#9AA0AA" />
              <Text className="text-xs font-subtitle text-[#9AA0AA]">
                Salvo só neste aparelho
              </Text>
            </HStack>
          </HStack>
          <HStack className="px-2 items-center justify-around w-full">
            <EmotionsDrawer />
            <ThoughtsDrawer />
            <ReactionsDrawer />
            <BehaviorsDrawer />
            <PhotoButton />
          </HStack>
        </VStack>
      </KeyboardAvoidingView>
    </VStack>
  )
}
