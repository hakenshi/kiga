import type { z } from "zod/v4";
import type {
  noteEmotionsInsertSchema,
  noteEmotionsSelectSchema,
} from "@/lib/db/zod/schemas/note/emotion.schema";

declare global {
  type NoteEmotion = z.infer<typeof noteEmotionsSelectSchema>;
  type NoteEmotionInsert = z.infer<typeof noteEmotionsInsertSchema>;
}
