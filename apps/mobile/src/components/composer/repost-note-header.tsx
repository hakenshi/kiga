import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ComposerHeader from "@/components/composer/composer-header";
import MoodRow from "@/components/composer/mood-row";
import { Button, ButtonText } from "@/components/ui/button";
import { noteMutations } from "@/queries/notes/queries";
import { useAuthStore } from "@/stores/auth-store";
import { useRepostNoteCacheStore } from "@/stores/repost-note-cache-store";

export default function RepostNoteHeader() {
  const router = useRouter();
  const client = useQueryClient();
  const userId = useAuthStore(state => state.user!.id);
  const moodId = useRepostNoteCacheStore(state => state.note.moodId);
  const toggleMood = useRepostNoteCacheStore(state => state.toggleMood);
  const save = useMutation(noteMutations.repostDraft(client, userId));
  const submit = () => save.mutate(undefined, { onSuccess: () => router.back() });
  return (
    <>
      <ComposerHeader>
        <Button onPress={submit} disabled={save.isPending}>
          <ButtonText>Salvar</ButtonText>
        </Button>
      </ComposerHeader>
      <MoodRow moodId={moodId} onSelect={toggleMood} />
    </>
  );
}
