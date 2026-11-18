import { useAuthStore } from "@/stores/auth-store";
import { Avatar, AvatarImage, AvatarFallbackText } from "../ui/avatar";
import { HStack } from "../ui/hstack";
import { VStack } from "../ui/vstack";
import { TextInput } from "react-native";
import Media from "./media";

interface Props {
  content: string
  placeholder?: string
  onChange: (content: string) => void
  images: string[]
  onRemoveImage: (uri: string) => void
  onReplaceImage: (uri: string, replacement: string) => void
}

export default function ComposerTextArea({
  content,
  placeholder = "No que você está pensando?:",
  onChange,
  images,
  onRemoveImage,
  onReplaceImage,
}: Props) {
  const firstName = useAuthStore((s) => s.user?.firstName);

  return (
    <HStack className="p-5 gap-3 items-start flex-1">
      <Avatar>
        <AvatarImage />
        <AvatarFallbackText>{firstName}</AvatarFallbackText>
      </Avatar>
      <VStack className="flex-1" space="md">
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#9AA0AA"
          autoFocus={false}
          multiline={true}
          scrollEnabled={true}
          className=""
          onChangeText={onChange}
          value={content}
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
        <Media images={images} onRemove={onRemoveImage} onReplace={onReplaceImage} />
      </VStack>
    </HStack>
  );
}
