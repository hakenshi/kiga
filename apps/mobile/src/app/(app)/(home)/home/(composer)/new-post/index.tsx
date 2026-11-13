import ComposerTextArea from "@/components/composer/author-row";
import { Composer } from "@/components/composer/frame";
import { useAuthStore } from "@/stores/auth-store";
import { useEntryStore } from "@/stores/journal-store";
import { useNewPostStore } from "@/stores/new-post-store";
import { useToastStore } from "@/stores/toast-store";
import { useRouter } from "expo-router";
import { Text } from "react-native";

export default function NewPostPage() {
  return (
    <ComposerTextArea />
  );
}
