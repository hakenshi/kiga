import { Composer } from "@/components/composer/frame";
import { useEditPostStore } from "@/stores/edit-post-store";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Text } from "react-native";

export default function EditEntryPage() {
  // const router = useRouter();
  // const { entryId } = useLocalSearchParams<{ entryId: string }>();
  //
  // useEffect(() => {
  //   if (entryId) {
  //     const numId = Number(entryId);
  //     const currentEditingId = useEditPostStore.getState().editingEntryId;
  //     if (currentEditingId !== numId) {
  //       useEditPostStore.getState().loadEntryForEdit(numId);
  //     }
  //   }
  // }, [entryId]);
  //
  // const actions = {
  //   close: () => {
  //     useEditPostStore.getState().reset();
  //     if (router.canGoBack()) {
  //       router.back();
  //     } else {
  //       router.push("/(home)/home");
  //     }
  //   },
  //   submit: async () => {
  //     const updated = await useEditPostStore.getState().saveEdit();
  //     if (updated) {
  //       if (router.canGoBack()) {
  //         router.back();
  //       } else {
  //         router.push("/(home)/home");
  //       }
  //     }
  //   },
  // };
  //
  return (
    <Text>
      wip
    </Text>
  );
}
