import type { z } from "zod/v4";
import type {
  reactionInsertSchema,
  reactionSelectSchema,
  reactionUpdateSchema,
} from "@/lib/db/zod/schemas/reaction/index.schema";

declare global {
  type Reaction = z.infer<typeof reactionSelectSchema>;
  type ReactionInsert = z.infer<typeof reactionInsertSchema>;
  type ReactionUpdate = z.infer<typeof reactionUpdateSchema>;
}
