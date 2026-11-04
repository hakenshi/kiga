import { Composer } from "@/components/composer/composer";
import { useEditPostStore } from "@/stores/edit-post-store";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";

export default function EditEntryPage() {
  const router = useRouter();
  const { entryId } = useLocalSearchParams<{ entryId: string }>();

  useEffect(() => {
    if (entryId) {
      const numId = Number(entryId);
      const currentEditingId = useEditPostStore.getState().editingEntryId;
      if (currentEditingId !== numId) {
        useEditPostStore.getState().loadEntryForEdit(numId);
      }
    }
  }, [entryId]);

  const actions = {
    close: () => {
      useEditPostStore.getState().reset();
      if (router.canGoBack()) {
        router.back();
      } else {
        router.push("/(home)/home");
      }
    },
    submit: async () => {
      const updated = await useEditPostStore.getState().saveEdit();
      if (updated) {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.push("/(home)/home");
        }
      }
    },
  };

  return (
    <Composer.Provider store={useEditPostStore} actions={actions}>
      <Composer.Frame>
        <Composer.Header
          title={<Composer.DateTitle />}
          submit={<Composer.Submit>Salvar</Composer.Submit>}
        />
        <Composer.MoodRow />
        <Composer.Body>
          <Composer.AuthorRow>
            <Composer.Editor placeholder="O que está acontecendo agora?" />
            <Composer.Media />
          </Composer.AuthorRow>
        </Composer.Body>
        <Composer.ChipStrip />
        <Composer.Dock />
      </Composer.Frame>
    </Composer.Provider>
  );
}
