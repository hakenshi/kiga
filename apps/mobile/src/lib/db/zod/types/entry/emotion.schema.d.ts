import type { z } from "zod/v4";
import type {
  entryEmotionsInsertSchema,
  entryEmotionsSelectSchema,
} from "@/lib/db/zod/schemas/entry/emotion.schema";

declare global {
  type EntryEmotion = z.infer<typeof entryEmotionsSelectSchema>;
  type EntryEmotionInsert = z.infer<typeof entryEmotionsInsertSchema>;
}
