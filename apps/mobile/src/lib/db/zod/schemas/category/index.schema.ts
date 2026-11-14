import { categories } from "@/lib/db/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const categorySelectSchema = createSelectSchema(categories);
export const categoryInsertSchema = createInsertSchema(categories, {
  name: (schema) => schema.trim().min(1, "Informe o nome da categoria"),
});
export const categoryUpdateSchema = categoryInsertSchema.partial();
export const categoryCreateFormSchema = categoryInsertSchema.pick({ name: true });
