import type { z } from "zod/v4";
import type {
  entryRepostInsertSchema,
  entryRepostSelectSchema,
} from "@/lib/db/zod/schemas/entry/repost.schema";

declare global {
  type EntryRepost = z.infer<typeof entryRepostSelectSchema>;
  type EntryRepostInsert = z.infer<typeof entryRepostInsertSchema>;
}
