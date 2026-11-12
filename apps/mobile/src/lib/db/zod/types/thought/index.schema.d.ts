import type { z } from "zod/v4";
import type {
  thoughtInsertSchema,
  thoughtSelectSchema,
  thoughtUpdateSchema,
} from "@/lib/db/zod/schemas/thought/index.schema";

declare global {
  type Thought = z.infer<typeof thoughtSelectSchema>;
  type ThoughtInsert = z.infer<typeof thoughtInsertSchema>;
  type ThoughtUpdate = z.infer<typeof thoughtUpdateSchema>;
}
