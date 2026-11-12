import { thoughts } from "@/lib/db/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const thoughtSelectSchema = createSelectSchema(thoughts);
export const thoughtInsertSchema = createInsertSchema(thoughts);
export const thoughtUpdateSchema = thoughtInsertSchema.partial();
