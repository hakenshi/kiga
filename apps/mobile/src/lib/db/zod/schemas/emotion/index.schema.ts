import { emotions } from "@/lib/db/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const emotionSelectSchema = createSelectSchema(emotions);
export const emotionInsertSchema = createInsertSchema(emotions);
export const emotionUpdateSchema = emotionInsertSchema.partial();
