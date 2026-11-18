import ComposerTextArea from "@/components/composer/author-row";
import { useNewNoteCacheStore } from "@/stores/new-note-cache-store";

export default function NewNotePage() {
  const note = useNewNoteCacheStore((s) => s.note);
  const update = useNewNoteCacheStore((s) => s.update);
  const removeImage = useNewNoteCacheStore((s) => s.removeImage);
  const replaceImage = useNewNoteCacheStore((s) => s.replaceImage);

  return (
    <ComposerTextArea
      content={note.content ?? ""}
      onChange={(content) => update({ content })}
      images={note.noteImages ?? []}
      onRemoveImage={removeImage}
      onReplaceImage={replaceImage}
    />
  );
}
