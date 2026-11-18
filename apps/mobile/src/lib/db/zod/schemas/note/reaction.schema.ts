import { noteReactions } from "@/lib/db/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const noteReactionsSelectSchema = createSelectSchema(noteReactions);
export const noteReactionsInsertSchema = createInsertSchema(noteReactions).omit({
  id: true,
});
