import type { z } from "zod/v4";
import type {
  noteImagesInsertSchema,
  noteImagesSelectSchema,
} from "@/lib/db/zod/schemas/note/image.schema";

declare global {
  type NoteImage = z.infer<typeof noteImagesSelectSchema>;
  type NoteImageInsert = z.infer<typeof noteImagesInsertSchema>;
}
