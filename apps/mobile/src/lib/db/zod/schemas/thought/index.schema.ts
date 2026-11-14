import { thoughts } from "@/lib/db/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const thoughtSelectSchema = createSelectSchema(thoughts);
export const thoughtInsertSchema = createInsertSchema(thoughts, {
  name: (schema) => schema.trim().min(1, "Informe o pensamento"),
});
export const thoughtUpdateSchema = thoughtInsertSchema.partial();
export const thoughtCreateFormSchema = thoughtInsertSchema.pick({ name: true });
