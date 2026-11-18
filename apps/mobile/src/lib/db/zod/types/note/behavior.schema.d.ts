import type { z } from "zod/v4";
import type {
  noteBehaviorInsertSchema,
  noteBehaviorSelectSchema,
} from "@/lib/db/zod/schemas/note/behavior.schema";

declare global {
  type NoteBehavior = z.infer<typeof noteBehaviorSelectSchema>;
  type NoteBehaviorInsert = z.infer<typeof noteBehaviorInsertSchema>;
}
