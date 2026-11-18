import type { z } from "zod/v4";
import type {
  noteRepliesInsertSchema,
  noteRepliesSelectSchema,
} from "@/lib/db/zod/schemas/note/reply.schema";

declare global {
  type NoteReply = z.infer<typeof noteRepliesSelectSchema>;
  type NoteReplyInsert = z.infer<typeof noteRepliesInsertSchema>;
}
