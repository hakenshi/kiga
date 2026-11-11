import { entryReplies } from "@/lib/db/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const entryRepliesSelectSchema = createSelectSchema(entryReplies)
export const entryRepliesInsertSchema = createInsertSchema(entryReplies).omit({
  id: true
})
