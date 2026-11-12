import type { z } from "zod/v4";
import type {
  categoryInsertSchema,
  categorySelectSchema,
  categoryUpdateSchema,
} from "@/lib/db/zod/schemas/category/index.schema";

declare global {
  type Category = z.infer<typeof categorySelectSchema>;
  type CategoryInsert = z.infer<typeof categoryInsertSchema>;
  type CategoryUpdate = z.infer<typeof categoryUpdateSchema>;
}
