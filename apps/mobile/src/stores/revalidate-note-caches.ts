import { useEditNoteCacheStore } from "./edit-note-cache-store";
import { useNewNoteCacheStore } from "./new-note-cache-store";
import { useReplyNoteCacheStore } from "./reply-note-cache-store";
import { useRepostNoteCacheStore } from "./repost-note-cache-store";

export function revalidateNoteCaches(): void {
  useNewNoteCacheStore.getState().revalidate();
  useEditNoteCacheStore.getState().revalidate();
  useReplyNoteCacheStore.getState().revalidate();
  useRepostNoteCacheStore.getState().revalidate();
}
