import { useAuthStore } from "@/stores/auth-store";
import { Avatar, AvatarImage, AvatarFallbackText } from "../ui/avatar";
import { HStack } from "../ui/hstack";
import { VStack } from "../ui/vstack";
import { TextInput } from "react-native";
import { useEntryCacheStore } from "@/stores/entry-cache-store";
import Media from "./media";

export default function ComposerTextArea() {
  const firstName = useAuthStore((s) => s.user?.firstName);
  const cachedContent = useEntryCacheStore(e => e.content)
  const updateCachedEntry = useEntryCacheStore(e => e.updateCachedEntry)

  return (
    <HStack className="p-5 gap-3 items-start flex-1">
      <Avatar>
        <AvatarImage />
        <AvatarFallbackText>{firstName}</AvatarFallbackText>
      </Avatar>
      <VStack className="flex-1" space="md">
        <TextInput
          placeholder="O que está acontecendo agora?"
          placeholderTextColor="#9AA0AA"
          autoFocus={false}
          multiline={true}
          scrollEnabled={true}
          className=""
          onChangeText={e => updateCachedEntry({ content: e })}
          value={cachedContent ?? ""}
          style={{
            flex: 1,
            textAlignVertical: "top",
            color: "#16181D",
            fontSize: 16,
            lineHeight: 22,
            paddingTop: 13,
            paddingBottom: 0,
          }
          }
        />
        <Media />
      </VStack>
    </HStack>
  );
}
