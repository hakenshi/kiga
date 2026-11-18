import { noteReposts } from "@/lib/db/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const noteRepostSelectSchema = createSelectSchema(noteReposts);
export const noteRepostInsertSchema = createInsertSchema(noteReposts).omit({
  id: true,
});
