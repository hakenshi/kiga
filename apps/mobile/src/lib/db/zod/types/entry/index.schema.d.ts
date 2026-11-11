import type { z } from "zod/v4";
import type {
  journalEntryInsertSchema,
  journalEntrySelectSchema,
  journalEntryUpdateSchema,
} from "@/lib/db/zod/schemas/entry/index.schema";

declare global {
  type JournalEntry = z.infer<typeof journalEntrySelectSchema>;
  type JournalEntryInsert = z.infer<typeof journalEntryInsertSchema>;
  type JournalEntryUpdate = z.infer<typeof journalEntryUpdateSchema>;
}
