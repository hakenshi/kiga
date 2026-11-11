import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { genderEnum, profileImages, pronounEnum, users } from "../../schema";
import {
  behaviorSelectSchema,
  categorySelectSchema,
  emotionSelectSchema,
  moodSelectSchema,
  reactionSelectSchema,
  thoughtSelectSchema,
} from "./resource.schema";
import { journalEntryWithRelationsSchema } from "./entry.schema";

// ─── TABELAS BASE (SELECT SCHEMAS VIA DRIZZLE-ZOD) ─────────────────────────
export const userSelectBaseSchema = createSelectSchema(users).omit({
  password: true,
  pin: true,
});

export const profileImageSelectSchema = createSelectSchema(profileImages);

// ─── TABELAS BASE (INSERT SCHEMAS VIA DRIZZLE-ZOD) ─────────────────────────
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

export const profileImageInsertSchema = createInsertSchema(profileImages, {
  url: (s) => s.min(1, "Informe o endereço da imagem"),
});

// ─── SCHEMAS DE AUTENTICAÇÃO E CADASTRO ────────────────────────────────────
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

// ─── USUÁRIO COMPLETO COM RELACIONAMENTOS (SESSÃO) ─────────────────────────
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
