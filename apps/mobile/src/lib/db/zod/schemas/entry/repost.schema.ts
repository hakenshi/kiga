import { entryReposts } from "@/lib/db/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const entryRepostSelectSchema = createSelectSchema(entryReposts)
export const entryRepostInsertSchema = createInsertSchema(entryReposts).omit({
  id: true
})
