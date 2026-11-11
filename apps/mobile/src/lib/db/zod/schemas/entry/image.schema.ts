import { entryImages } from "@/lib/db/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const entryImagesSelectSchema = createSelectSchema(entryImages)
export const entryImagesInsertSchema = createInsertSchema(entryImages).omit({
  id: true
})
