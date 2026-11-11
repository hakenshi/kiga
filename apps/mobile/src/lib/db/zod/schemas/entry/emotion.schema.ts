import { entryEmotions } from "@/lib/db/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const entryEmotionsSelectSchema = createSelectSchema(entryEmotions)
export const entryEmotionsInsertSchema = createInsertSchema(entryEmotions).omit({
  id: true
})
