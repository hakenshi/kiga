import ComposerTextArea from "@/components/composer/author-row";
import { useEditNoteCacheStore } from "@/stores/edit-note-cache-store";
import ComposerShell from "@/components/composer/composer-shell";
import EditNoteHeader from "@/components/composer/edit-note-header";

export default function EditNotePage() {
  const note = useEditNoteCacheStore((s) => s.note);
  const update = useEditNoteCacheStore((s) => s.update);
  const removeImage = useEditNoteCacheStore((s) => s.removeImage);
  const replaceImage = useEditNoteCacheStore((s) => s.replaceImage);

  return (
    <ComposerShell draftStore={useEditNoteCacheStore} header={<EditNoteHeader />}>
      <ComposerTextArea
        content={note.content ?? ""}
        onChange={(content) => update({ content })}
        images={note.noteImages ?? []}
        onRemoveImage={removeImage}
        onReplaceImage={replaceImage}
      />
    </ComposerShell>
  );
}
