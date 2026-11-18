import { noteEmotions } from "@/lib/db/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const noteEmotionsSelectSchema = createSelectSchema(noteEmotions);
export const noteEmotionsInsertSchema = createInsertSchema(noteEmotions).omit({
  id: true,
});
