import type { z } from "zod/v4";
import type {
  behaviorInsertSchema,
  behaviorSelectSchema,
  behaviorUpdateSchema,
} from "@/lib/db/zod/schemas/behavior/index.schema";

declare global {
  type Behavior = z.infer<typeof behaviorSelectSchema>;
  type BehaviorInsert = z.infer<typeof behaviorInsertSchema>;
  type BehaviorUpdate = z.infer<typeof behaviorUpdateSchema>;
}
