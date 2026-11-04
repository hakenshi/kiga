import { Composer } from "@/components/composer/composer";
import { createJournalEntry } from "@/lib/db/entries";
import { useAuthStore } from "@/stores/auth-store";
import { useEntryStore } from "@/stores/journal-store";
import { useNewPostStore } from "@/stores/new-post-store";
import { useToastStore } from "@/stores/toast-store";
import { useRouter } from "expo-router";

export default function NewPostPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { addEntry } = useEntryStore();

  const actions = {
    close: () => {
      router.push("/(home)/home");
    },
    submit: async () => {
      const state = useNewPostStore.getState();
      if (!state.content.trim()) return;

      useNewPostStore.setState({ isSaving: true });
      try {
        const newEntry = await createJournalEntry({
          userId: user!.id,
          content: state.content,
          moodId: state.moodId,
          emotions: state.emotions,
          thoughts: state.thoughts,
          reactions: state.reactions,
          behaviors: state.behaviors,
          images: state.images,
          date: state.entryDate,
        });

        addEntry(newEntry);
        state.reset();
        router.push("/(home)/home");
      } catch (err) {
        useToastStore.getState().showError("Falha ao salvar o relato.", err);
        useNewPostStore.setState({ isSaving: false });
      }
    },
  };

  return (
    <Composer.Provider store={useNewPostStore} actions={actions}>
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
