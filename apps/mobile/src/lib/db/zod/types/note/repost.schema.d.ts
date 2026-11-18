import type { z } from "zod/v4";
import type {
  noteRepostInsertSchema,
  noteRepostSelectSchema,
} from "@/lib/db/zod/schemas/note/repost.schema";

declare global {
  type NoteRepost = z.infer<typeof noteRepostSelectSchema>;
  type NoteRepostInsert = z.infer<typeof noteRepostInsertSchema>;
}
