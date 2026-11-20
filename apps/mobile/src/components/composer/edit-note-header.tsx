import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ComposerHeader from "@/components/composer/composer-header";
import MoodRow from "@/components/composer/mood-row";
import { noteMutations } from "@/queries/notes/queries";
import { useAuthStore } from "@/stores/auth-store";
import { useEditNoteCacheStore } from "@/stores/edit-note-cache-store";
import CloseButton from "./composer-header/close-button";
import SaveButton from "./composer-header/save-button";

export default function EditNoteHeader() {
  const router = useRouter();
  const client = useQueryClient();
  const userId = useAuthStore(state => state.user!.id);
  const moodId = useEditNoteCacheStore(state => state.note.moodId);
  const toggleMood = useEditNoteCacheStore(state => state.toggleMood);
  const save = useMutation(noteMutations.updateDraft(client, userId));
  const submit = () => save.mutate(undefined, { onSuccess: () => router.back() });
  const close = () => {
    router.push("/home")
  }
  return (
    <>
      <ComposerHeader>
        <CloseButton close={close} />
        <SaveButton submit={submit} disabled={save.isPending} />
      </ComposerHeader>
      <MoodRow moodId={moodId} onSelect={toggleMood} />
    </>
  );
}
