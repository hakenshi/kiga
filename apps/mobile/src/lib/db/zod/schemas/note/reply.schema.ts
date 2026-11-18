import { noteReplies } from "@/lib/db/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const noteRepliesSelectSchema = createSelectSchema(noteReplies);
export const noteRepliesInsertSchema = createInsertSchema(noteReplies).omit({
  id: true,
});
