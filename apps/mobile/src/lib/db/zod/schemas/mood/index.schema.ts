import { moods } from "@/lib/db/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const moodSelectSchema = createSelectSchema(moods);
export const moodInsertSchema = createInsertSchema(moods);
export const moodUpdateSchema = moodInsertSchema.partial();
