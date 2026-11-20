import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import MoodRow from "@/components/composer/mood-row";
import { noteMutations } from "@/queries/notes/queries";
import { useAuthStore } from "@/stores/auth-store";
import { useNewNoteCacheStore } from "@/stores/new-note-cache-store";
import CloseButton from "./composer-header/close-button";
import SaveButton from "./composer-header/save-button";
import ComposerHeader from "./composer-header";

export default function NewNoteHeader() {
  const router = useRouter();
  const client = useQueryClient();
  const userId = useAuthStore(state => state.user!.id);
  const moodId = useNewNoteCacheStore(state => state.note.moodId);
  const toggleMood = useNewNoteCacheStore(state => state.toggleMood);
  const save = useMutation(noteMutations.createDraft(client, userId));
  const submit = () => save.mutate(undefined, { onSuccess: () => router.push("/home") });
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
