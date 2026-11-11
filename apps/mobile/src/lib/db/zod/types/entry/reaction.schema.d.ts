import type { z } from "zod/v4";
import type {
  entryReactionsInsertSchema,
  entryReactionsSelectSchema,
} from "@/lib/db/zod/schemas/entry/reaction.schema";

declare global {
  type EntryReaction = z.infer<typeof entryReactionsSelectSchema>;
  type EntryReactionInsert = z.infer<typeof entryReactionsInsertSchema>;
}
