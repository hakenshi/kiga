import type { z } from "zod/v4";
import type {
  emotionInsertSchema,
  emotionSelectSchema,
  emotionUpdateSchema,
} from "@/lib/db/zod/schemas/emotion/index.schema";

declare global {
  type Emotion = z.infer<typeof emotionSelectSchema>;
  type EmotionInsert = z.infer<typeof emotionInsertSchema>;
  type EmotionUpdate = z.infer<typeof emotionUpdateSchema>;
}
