import { noteImages } from "@/lib/db/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const noteImagesSelectSchema = createSelectSchema(noteImages);
export const noteImagesInsertSchema = createInsertSchema(noteImages).omit({
  id: true,
});
