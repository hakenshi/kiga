import type { z } from "zod/v4";
import type {
  noteInsertSchema,
  noteSelectSchema,
  noteUpdateSchema,
} from "@/lib/db/zod/schemas/note/index.schema";

declare global {
  type Note = z.infer<typeof noteSelectSchema>;
  type NoteInsert = z.infer<typeof noteInsertSchema>;
  type NoteUpdate = z.infer<typeof noteUpdateSchema>;
}
