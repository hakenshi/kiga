import type { z } from "zod/v4";
import type {
  entryRepliesInsertSchema,
  entryRepliesSelectSchema,
} from "@/lib/db/zod/schemas/entry/reply.schema";

declare global {
  type EntryReply = z.infer<typeof entryRepliesSelectSchema>;
  type EntryReplyInsert = z.infer<typeof entryRepliesInsertSchema>;
}
