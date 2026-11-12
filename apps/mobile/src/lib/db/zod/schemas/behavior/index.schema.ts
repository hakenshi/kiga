import { behaviors } from "@/lib/db/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const behaviorSelectSchema = createSelectSchema(behaviors);
export const behaviorInsertSchema = createInsertSchema(behaviors);
export const behaviorUpdateSchema = behaviorInsertSchema.partial();
