import { reactions } from "@/lib/db/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const reactionSelectSchema = createSelectSchema(reactions);
export const reactionInsertSchema = createInsertSchema(reactions);
export const reactionUpdateSchema = reactionInsertSchema.partial();
