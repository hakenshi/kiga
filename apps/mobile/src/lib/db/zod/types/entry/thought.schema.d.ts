import type { z } from "zod/v4";
import type {
  entryThoughtsInsertSchema,
  entryThoughtsSelectSchema,
} from "@/lib/db/zod/schemas/entry/thought.schema";

declare global {
  type EntryThought = z.infer<typeof entryThoughtsSelectSchema>;
  type EntryThoughtInsert = z.infer<typeof entryThoughtsInsertSchema>;
}
