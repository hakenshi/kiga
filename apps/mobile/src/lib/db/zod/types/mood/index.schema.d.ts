import type { z } from "zod/v4";
import type {
  moodInsertSchema,
  moodSelectSchema,
  moodUpdateSchema,
} from "@/lib/db/zod/schemas/mood/index.schema";

declare global {
  type Mood = z.infer<typeof moodSelectSchema>;
  type MoodInsert = z.infer<typeof moodInsertSchema>;
  type MoodUpdate = z.infer<typeof moodUpdateSchema>;
}
