import type { z } from "zod/v4";
import type {
  entryBehaviorInsertSchema,
  entryBehaviorSelectSchema,
} from "@/lib/db/zod/schemas/entry/behavior.schema";

declare global {
  type EntryBehavior = z.infer<typeof entryBehaviorSelectSchema>;
  type EntryBehaviorInsert = z.infer<typeof entryBehaviorInsertSchema>;
}
