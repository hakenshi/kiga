import { entryThoughts } from "@/lib/db/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const entryThoughtsSelectSchema = createSelectSchema(entryThoughts)
export const entryThoughtsInsertSchema = createInsertSchema(entryThoughts).omit({
  id: true
})
