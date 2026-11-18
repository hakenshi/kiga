import type { z } from "zod/v4";
import type {
  noteReactionsInsertSchema,
  noteReactionsSelectSchema,
} from "@/lib/db/zod/schemas/note/reaction.schema";

declare global {
  type NoteReaction = z.infer<typeof noteReactionsSelectSchema>;
  type NoteReactionInsert = z.infer<typeof noteReactionsInsertSchema>;
}
