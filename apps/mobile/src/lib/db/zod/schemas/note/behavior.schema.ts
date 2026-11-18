import { noteBehaviors } from "@/lib/db/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const noteBehaviorSelectSchema = createSelectSchema(noteBehaviors);
export const noteBehaviorInsertSchema = createInsertSchema(noteBehaviors).omit({
  id: true,
});
