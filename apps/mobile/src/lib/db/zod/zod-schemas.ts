import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { genderEnum, pronounEnum, users } from "../schema";
import { z } from "zod/v4";

export const userSelectBaseSchema = createSelectSchema(users).omit({
  password: true,
  pin: true,
});

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
      .min(1, "Informe o PIN")
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
  gender: z.enum(genderEnum, { error: "Selecione um gênero válido" }),
  pronoun: z.enum(pronounEnum, { error: "Selecione um pronome válido" }),
});

export const userInsertSchema = userInsertBaseSchema.transform((data) => ({
  ...data,
  username: data.username.trim(),
  password: data.password.trim(),
  firstName: data.firstName.trim(),
  secondName: data.secondName.trim(),
}));

export const userInsterSchema = userInsertSchema;

export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Informe o nome de usuário")
    .min(3, "O nome de usuário deve ter no mínimo 3 caracteres"),
  password: z
    .string()
    .min(1, "Informe a senha")
    .min(3, "A senha deve ter no mínimo 3 caracteres"),
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

export const registerNameSchema = z.object({
  firstName: userInsertBaseSchema.shape.firstName,
  secondName: userInsertBaseSchema.shape.secondName,
  username: userInsertBaseSchema.shape.username,
  birthDate: birthDateSchema,
});

export const registerSecuritySchema = z
  .object({
    password: userInsertBaseSchema.shape.password,
    confirmPassword: userInsertBaseSchema.shape.password,
  })
  .refine(
    (d) => d.password.toLowerCase().trim() === d.confirmPassword.toLowerCase().trim(),
    {
      message: "As senhas não coincidem",
      path: ["confirmPassword"],
    }
  );

export const registerIdentitySchema = z.object({
  gender: z.enum(genderEnum, { error: "Selecione um gênero" }),
  pronoun: z.enum(pronounEnum, { error: "Selecione um pronome" }),
});

export const registerPinSchema = z.object({
  pin: z
    .string()
    .min(1, "Informe o PIN de segurança")
    .regex(/^\d+$/, "O PIN deve conter apenas números")
    .min(4, "O PIN deve ter no mínimo 4 dígitos")
    .max(6, "O PIN deve ter no máximo 6 dígitos"),
});

export const registerSchema = userInsertBaseSchema
  .extend({
    confirmPassword: z
      .string()
      .min(1, "Confirme a sua senha")
      .min(3, "A senha deve ter no mínimo 3 caracteres"),
    birthDate: birthDateSchema,
  })
  .refine(
    (d) => d.password.toLowerCase().trim() === d.confirmPassword.toLowerCase().trim(),
    {
      message: "As senhas não coincidem",
      path: ["confirmPassword"],
    }
  );

export const newPostSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "O conteúdo do post não pode ficar em branco"),
  moodId: z.number().nullable().optional(),
  emotions: z
    .array(z.object({ id: z.number(), name: z.string() }))
    .default([]),
  thoughts: z
    .array(z.object({ id: z.number(), name: z.string() }))
    .default([]),
  reactions: z
    .array(z.object({ id: z.number(), name: z.string() }))
    .default([]),
});

export type NewPostInput = z.input<typeof newPostSchema>;
export type NewPostSchema = z.output<typeof newPostSchema>;
