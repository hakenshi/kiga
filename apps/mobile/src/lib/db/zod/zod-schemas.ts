import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import {
  behaviors,
  categories,
  emotions,
  entryBehaviors,
  entryEmotions,
  entryImages,
  entryReactions,
  entryThoughts,
  genderEnum,
  journalEntries,
  journalEntryType,
  moods,
  profileImages,
  pronounEnum,
  reactions,
  thoughts,
  users,
} from "../schema";
import { z } from "zod/v4";

// ─── 1. TABELAS BASE (SELECT SCHEMAS VIA DRIZZLE-ZOD) ─────────────────────
export const userSelectBaseSchema = createSelectSchema(users).omit({
  password: true,
  pin: true,
});

export const categorySelectSchema = createSelectSchema(categories);
export const emotionSelectSchema = createSelectSchema(emotions);
export const thoughtSelectSchema = createSelectSchema(thoughts);
export const reactionSelectSchema = createSelectSchema(reactions);
export const behaviorSelectSchema = createSelectSchema(behaviors);
export const moodSelectSchema = createSelectSchema(moods);
export const profileImageSelectSchema = createSelectSchema(profileImages);
export const journalEntrySelectSchema = createSelectSchema(journalEntries);

// Tabelas Pivot / Junções
export const entryEmotionSelectSchema = createSelectSchema(entryEmotions);
export const entryThoughtSelectSchema = createSelectSchema(entryThoughts);
export const entryReactionSelectSchema = createSelectSchema(entryReactions);
export const entryBehaviorSelectSchema = createSelectSchema(entryBehaviors);
export const entryImageSelectSchema = createSelectSchema(entryImages);

// ─── 2. TABELAS BASE (INSERT SCHEMAS VIA DRIZZLE-ZOD) ─────────────────────
export const userInsertBaseSchema = createInsertSchema(users, {
  username: (s) =>
    s
      .trim()
      .min(1, "Informe o nome de usuário")
      .min(3, "O nome de usuário deve ter no mínimo 3 caracteres"),
  password: (s) =>
    s
      .min(1, "Informe a senha")
      .min(3, "A senha deve ter no mínimo 3 caracteres"),
  pin: (s) =>
    s
      .min(1, "Informe o PIN de segurança")
      .regex(/^\d+$/, "O PIN deve conter apenas números")
      .min(4, "O PIN deve ter no mínimo 4 dígitos")
      .max(6, "O PIN deve ter no máximo 6 dígitos"),
  firstName: (s) =>
    s
      .trim()
      .min(1, "Informe o primeiro nome")
      .min(2, "O primeiro nome deve ter no mínimo 2 caracteres"),
  secondName: (s) =>
    s
      .trim()
      .min(1, "Informe o sobrenome")
      .min(2, "O sobrenome deve ter no mínimo 2 caracteres"),
  gender: z.enum(genderEnum, { error: "Selecione um gênero" }),
  pronoun: z.enum(pronounEnum, { error: "Selecione um pronome" }),
});

export const userInsertSchema = userInsertBaseSchema.transform((data) => ({
  ...data,
  username: data.username.trim(),
  password: data.password.trim(),
  firstName: data.firstName.trim(),
  secondName: data.secondName.trim(),
}));

export const categoryInsertSchema = createInsertSchema(categories, {
  name: (s) => s.trim().min(1, "Informe o nome da categoria"),
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
export const moodInsertSchema = createInsertSchema(moods, {
  name: (s) => s.trim().min(1, "Informe o humor"),
});
export const profileImageInsertSchema = createInsertSchema(profileImages, {
  url: (s) => s.min(1, "Informe o endereço da imagem"),
});
export const journalEntryInsertSchema = createInsertSchema(journalEntries, {
  content: (s) =>
    s
      .trim()
      .min(1, "O conteúdo do relato não pode ficar em branco"),
  entryType: z.enum(journalEntryType).default("post"),
});

// ─── 3. SCHEMAS COM RELACIONAMENTOS (DRIZZLE RELATIONS) ───────────────────
export const entryEmotionWithRelationSchema = entryEmotionSelectSchema.extend({
  emotion: emotionSelectSchema.optional(),
});

export const entryThoughtWithRelationSchema = entryThoughtSelectSchema.extend({
  thought: thoughtSelectSchema.optional(),
});

export const entryReactionWithRelationSchema = entryReactionSelectSchema.extend({
  reaction: reactionSelectSchema.optional(),
});

export const entryBehaviorWithRelationSchema = entryBehaviorSelectSchema.extend({
  behavior: behaviorSelectSchema.optional(),
});

// Entry completo com todos os relacionamentos filhos
export const journalEntryWithRelationsSchema = journalEntrySelectSchema.extend({
  mood: moodSelectSchema.nullable().optional(),
  entryEmotions: z.array(entryEmotionWithRelationSchema).optional(),
  entryThoughts: z.array(entryThoughtWithRelationSchema).optional(),
  entryReactions: z.array(entryReactionWithRelationSchema).optional(),
  entryBehaviors: z.array(entryBehaviorWithRelationSchema).optional(),
  entryImages: z.array(entryImageSelectSchema).optional(),
});

// Categoria com itens relacionados
export const categoryWithItemsSchema = categorySelectSchema.extend({
  emotions: z.array(emotionSelectSchema).optional(),
  thoughts: z.array(thoughtSelectSchema).optional(),
  reactions: z.array(reactionSelectSchema).optional(),
  behaviors: z.array(behaviorSelectSchema).optional(),
});

// Usuário completo com todos os dados associados (Sessão / Login)
export const userWithRelationsSchema = userSelectBaseSchema.extend({
  categories: z.array(categorySelectSchema).optional(),
  emotions: z.array(emotionSelectSchema).optional(),
  thoughts: z.array(thoughtSelectSchema).optional(),
  reactions: z.array(reactionSelectSchema).optional(),
  behaviors: z.array(behaviorSelectSchema).optional(),
  moods: z.array(moodSelectSchema).optional(),
  profileImages: z.array(profileImageSelectSchema).optional(),
  journalEntries: z.array(journalEntryWithRelationsSchema).optional(),
});

// ─── 4. SCHEMAS DE AUTENTICAÇÃO E CADASTRO (VIA DRIZZLE-ZOD) ──────────────
export const loginSchema = userInsertBaseSchema.pick({
  username: true,
  password: true,
});

export const birthDateSchema = z
  .union([
    z.date(),
    z.string().trim().min(1, "Informe a data de nascimento"),
  ])
  .transform((val, ctx) => {
    if (val instanceof Date) {
      if (isNaN(val.getTime())) {
        ctx.addIssue({ code: "custom", message: "Data de nascimento inválida" });
        return z.NEVER;
      }
      if (val > new Date()) {
        ctx.addIssue({ code: "custom", message: "A data de nascimento não pode ser no futuro" });
        return z.NEVER;
      }
      return val;
    }

    const clean = val.trim();
    if (clean.length === 0) {
      ctx.addIssue({ code: "custom", message: "Informe a data de nascimento" });
      return z.NEVER;
    }

    if (clean.includes("/")) {
      const parts = clean.split("/");
      if (parts.length !== 3 || clean.length !== 10) {
        ctx.addIssue({ code: "custom", message: "Data incompleta. Use DD/MM/AAAA" });
        return z.NEVER;
      }
      const [d, m, y] = parts.map(Number);
      if (!d || !m || !y || isNaN(d) || isNaN(m) || isNaN(y)) {
        ctx.addIssue({ code: "custom", message: "Data de nascimento inválida" });
        return z.NEVER;
      }
      if (y < 1900) {
        ctx.addIssue({ code: "custom", message: "Ano de nascimento inválido" });
        return z.NEVER;
      }
      const date = new Date(Date.UTC(y, m - 1, d));
      if (
        isNaN(date.getTime()) ||
        date.getUTCFullYear() !== y ||
        date.getUTCMonth() !== m - 1 ||
        date.getUTCDate() !== d
      ) {
        ctx.addIssue({ code: "custom", message: "Data de nascimento inválida" });
        return z.NEVER;
      }
      if (date > new Date()) {
        ctx.addIssue({ code: "custom", message: "A data de nascimento não pode ser no futuro" });
        return z.NEVER;
      }
      return date;
    }

    const date = new Date(clean);
    if (isNaN(date.getTime())) {
      ctx.addIssue({ code: "custom", message: "Data de nascimento inválida" });
      return z.NEVER;
    }
    if (date.getUTCFullYear() < 1900) {
      ctx.addIssue({ code: "custom", message: "Ano de nascimento inválido" });
      return z.NEVER;
    }
    if (date > new Date()) {
      ctx.addIssue({ code: "custom", message: "A data de nascimento não pode ser no futuro" });
      return z.NEVER;
    }
    return date;
  });

export const registerNameSchema = userInsertBaseSchema
  .pick({
    firstName: true,
    secondName: true,
    username: true,
  })
  .extend({
    birthDate: birthDateSchema,
  });

export const registerSecuritySchema = userInsertBaseSchema
  .pick({
    password: true,
  })
  .extend({
    confirmPassword: userInsertBaseSchema.shape.password,
  })
  .refine(
    (d) => d.password.toLowerCase().trim() === d.confirmPassword.toLowerCase().trim(),
    {
      message: "As senhas não coincidem",
      path: ["confirmPassword"],
    }
  );

export const registerIdentitySchema = userInsertBaseSchema.pick({
  gender: true,
  pronoun: true,
});

export const registerPinSchema = userInsertBaseSchema.pick({
  pin: true,
});

export const registerSchema = userInsertBaseSchema
  .extend({
    confirmPassword: userInsertBaseSchema.shape.password,
    birthDate: birthDateSchema,
  })
  .refine(
    (d) => d.password.toLowerCase().trim() === d.confirmPassword.toLowerCase().trim(),
    {
      message: "As senhas não coincidem",
      path: ["confirmPassword"],
    }
  );

// ─── 5. ITENS DAS RELAÇÕES DO DIÁRIO (DRIZZLE-ZOD) ──────────────────────
export const entryEmotionItemSchema = emotionSelectSchema.pick({
  id: true,
  name: true,
});

export const entryThoughtItemSchema = thoughtSelectSchema.pick({
  id: true,
  name: true,
});

export const entryReactionItemSchema = reactionSelectSchema.pick({
  id: true,
  name: true,
});

export const entryBehaviorItemSchema = behaviorInsertSchema
  .pick({
    content: true,
    icon: true,
  })
  .extend({
    id: behaviorSelectSchema.shape.id.optional(),
  });

// ─── 6. RELATO DO DIÁRIO (NOVA ENTRY / PERSISTÊNCIA VIA DRIZZLE-ZOD) ──────
export const newEntrySchema = journalEntryInsertSchema
  .pick({
    content: true,
    moodId: true,
    entryType: true,
  })
  .extend({
    emotions: z.array(entryEmotionItemSchema).default([]),
    thoughts: z.array(entryThoughtItemSchema).default([]),
    reactions: z.array(entryReactionItemSchema).default([]),
    behaviors: z.array(entryBehaviorItemSchema).default([]),
  });

export const createJournalEntrySchema = newEntrySchema.extend({
  userId: journalEntryInsertSchema.shape.userId,
  date: journalEntryInsertSchema.shape.date.optional(),
});

export const journalEntryUpdateSchema = journalEntryInsertSchema.partial()
