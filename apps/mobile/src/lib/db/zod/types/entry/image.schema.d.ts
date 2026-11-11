import type { z } from "zod/v4";
import type {
  entryImagesInsertSchema,
  entryImagesSelectSchema,
} from "@/lib/db/zod/schemas/entry/image.schema";

declare global {
  type EntryImage = z.infer<typeof entryImagesSelectSchema>;
  type EntryImageInsert = z.infer<typeof entryImagesInsertSchema>;
}
