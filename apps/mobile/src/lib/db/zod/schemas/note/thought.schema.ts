import { noteThoughts } from "@/lib/db/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const noteThoughtsSelectSchema = createSelectSchema(noteThoughts);
export const noteThoughtsInsertSchema = createInsertSchema(noteThoughts).omit({
  id: true,
});
