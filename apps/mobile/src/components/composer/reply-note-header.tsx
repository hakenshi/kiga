import { useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ComposerHeader from "@/components/composer/composer-header";
import MoodRow from "@/components/composer/mood-row";
import { Button, ButtonText } from "@/components/ui/button";
import { noteMutations } from "@/queries/notes/queries";
import { useAuthStore } from "@/stores/auth-store";
import { useReplyNoteCacheStore } from "@/stores/reply-note-cache-store";
import CloseButton from "./composer-header/close-button";
import SaveButton from "./composer-header/save-button";
import { useNote } from "../note/note-context";

export default function ReplyNoteHeader() {
  const router = useRouter();
  const client = useQueryClient();
  const { noteId } = useLocalSearchParams<{ noteId: string }>();
  const userId = useAuthStore(state => state.user!.id);
  const moodId = useReplyNoteCacheStore(state => state.note.moodId);
  const toggleMood = useReplyNoteCacheStore(state => state.toggleMood);
  const save = useMutation(noteMutations.replyDraft(client, userId, noteId));
  const submit = () => save.mutate(undefined, {
    onSuccess: () =>
      router.push(`/home/view-note`)
  });
  const close = () => {
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
