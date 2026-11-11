import { entryBehaviors } from "@/lib/db/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const entryBehaviorSelectSchema = createSelectSchema(entryBehaviors)
export const entryBehaviorInsertSchema = createInsertSchema(entryBehaviors).omit({
  id: true
})
