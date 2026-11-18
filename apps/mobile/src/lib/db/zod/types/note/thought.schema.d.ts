import type { z } from "zod/v4";
import type {
  noteThoughtsInsertSchema,
  noteThoughtsSelectSchema,
} from "@/lib/db/zod/schemas/note/thought.schema";

declare global {
  type NoteThought = z.infer<typeof noteThoughtsSelectSchema>;
  type NoteThoughtInsert = z.infer<typeof noteThoughtsInsertSchema>;
}
