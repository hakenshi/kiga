import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import {
  behaviors,
  categories,
  categoryTypeEnum,
  emotions,
  moods,
  reactions,
  thoughts,
} from "../../schema";

// ─── TABELAS BASE (SELECT SCHEMAS VIA DRIZZLE-ZOD) ─────────────────────────
export const categorySelectSchema = createSelectSchema(categories);
export const moodSelectSchema = createSelectSchema(moods);
export const emotionSelectSchema = createSelectSchema(emotions);
export const thoughtSelectSchema = createSelectSchema(thoughts);
export const reactionSelectSchema = createSelectSchema(reactions);
export const behaviorSelectSchema = createSelectSchema(behaviors);

// ─── TABELAS BASE (INSERT SCHEMAS VIA DRIZZLE-ZOD) ─────────────────────────
export const categoryInsertSchema = createInsertSchema(categories, {
  name: (s) => s.trim().min(1, "Informe o nome da categoria"),
});

export const moodInsertSchema = createInsertSchema(moods, {
  name: (s) => s.trim().min(1, "Informe o humor"),
});

export const emotionInsertSchema = createInsertSchema(emotions, {
  name: (s) => s.trim().min(1, "Informe o nome da emoção"),
});

export const thoughtInsertSchema = createInsertSchema(thoughts, {
  name: (s) => s.trim().min(1, "Informe o pensamento"),
});

export const reactionInsertSchema = createInsertSchema(reactions, {
  name: (s) => s.trim().min(1, "Informe a reação"),
});

export const behaviorInsertSchema = createInsertSchema(behaviors, {
  content: z.string().trim().min(1, "Informe o comportamento"),
});

// ─── CATEGORIA COM ITENS RELACIONADOS ──────────────────────────────────────
export const categoryWithItemsSchema = categorySelectSchema.extend({
  emotions: z.array(emotionSelectSchema).optional(),
  thoughts: z.array(thoughtSelectSchema).optional(),
  reactions: z.array(reactionSelectSchema).optional(),
  behaviors: z.array(behaviorSelectSchema).optional(),
});

// ─── FORMULÁRIOS DOS DRAWERS (CRIAÇÃO DE ITENS E CATEGORIAS) ───────────────
export const createCategoryFormSchema = categoryInsertSchema.pick({
  name: true,
});

export const createEmotionFormSchema = emotionInsertSchema
  .pick({
    name: true,
  })
  .extend({
    categoryName: z.string().nullable().optional(),
  });

export const createThoughtFormSchema = thoughtInsertSchema.pick({
  name: true,
});

export const createReactionFormSchema = reactionInsertSchema
  .pick({
    name: true,
  })
  .extend({
    categoryName: z.string().nullable().optional(),
  });

export const createBehaviorFormSchema = behaviorInsertSchema
  .pick({
    content: true,
    icon: true,
  })
  .extend({
    categoryName: z.string().nullable().optional(),
  });

// ─── SCHEMAS DE RECURSOS E COMPORTAMENTOS (PROJEÇÃO DE CONSULTA) ───────────
export const resourceItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  categoryId: z.number().nullable(),
  categoryName: z.string().nullable().optional(),
  orderIndex: z.number(),
  userId: z.number().nullable(),
});

export const resourceCategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.enum(categoryTypeEnum).optional(),
  orderIndex: z.number(),
  userId: z.number().nullable(),
  items: z.array(resourceItemSchema),
});

export const behaviorItemSchema = z.object({
  id: z.number(),
  content: z.string(),
  icon: z.string().nullable(),
  categoryId: z.number().nullable(),
  categoryName: z.string().nullable().optional(),
  userId: z.number().nullable(),
  orderIndex: z.number(),
});

export const behaviorCategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  orderIndex: z.number(),
  items: z.array(behaviorItemSchema),
});
