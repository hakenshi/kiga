import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ComposerHeader from "@/components/composer/composer-header";
import MoodRow from "@/components/composer/mood-row";
import { Button, ButtonText } from "@/components/ui/button";
import { noteMutations } from "@/queries/notes/queries";
import { useAuthStore } from "@/stores/auth-store";
import { useReplyNoteCacheStore } from "@/stores/reply-note-cache-store";

export default function ReplyNoteHeader() {
  const router = useRouter();
  const client = useQueryClient();
  const { noteId } = useLocalSearchParams<{ noteId: string }>();
  const userId = useAuthStore(state => state.user!.id);
  const moodId = useReplyNoteCacheStore(state => state.note.moodId);
  const toggleMood = useReplyNoteCacheStore(state => state.toggleMood);
  const save = useMutation(noteMutations.replyDraft(client, userId, noteId));
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
