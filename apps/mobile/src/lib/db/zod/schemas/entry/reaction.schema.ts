import { entryReactions } from "@/lib/db/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const entryReactionsSelectSchema = createSelectSchema(entryReactions)
export const entryReactionsInsertSchema = createInsertSchema(entryReactions).omit({
  id: true
})
