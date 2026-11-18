import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { format, isFuture, isValid, parse } from "date-fns";
import { z } from "zod/v4";
import { genderEnum, profileImages, pronounEnum, users } from "../../schema";
import { behaviorSelectSchema } from "./behavior/index.schema";
import { categorySelectSchema } from "./category/index.schema";
import { emotionSelectSchema } from "./emotion/index.schema";
import { moodSelectSchema } from "./mood/index.schema";
import { reactionSelectSchema } from "./reaction/index.schema";
import { thoughtSelectSchema } from "./thought/index.schema";
import { noteSelectSchema } from "./note/index.schema";

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
}).omit({
  createdAt: true,
})

export const userInsertSchema = userInsertBaseSchema.transform((data) => ({
  ...data,
  username: data.username.trim(),
  password: data.password.trim(),
  firstName: data.firstName.trim(),
  secondName: data.secondName.trim(),
}));

export const userUpdateSchema = userInsertBaseSchema.partial();


export const profileImageInsertSchema = createInsertSchema(profileImages, {

  url: (s) => s.min(1, "Informe o endereço da imagem"),
});

// ─── SCHEMAS DE AUTENTICAÇÃO E CADASTRO ────────────────────────────────────
export const loginSchema = userInsertBaseSchema.pick({
  username: true,
  password: true,
});

const birthDateSchema = z.string({ error: "Insira uma data válida" }).trim().min(1, "Informe uma data de nascimento").transform((v, ctx) => {
  const date = parse(v, "dd/MM/yyyy", new Date())
  if (!isValid(date) || format(date, "dd/MM/yyyy") !== v) {
    ctx.addIssue({
      code: "custom",
      message: "Data inválida, use DD/MM/YYYY"
    })
    return z.NEVER
  }
  return date
})
  .refine((d) => d.getFullYear() >= 1920, {
    message: "Ano de nascimento inválido"
  })
  .refine(d => !isFuture(d), {
    message: "Você não é um viajante do tempo."
  })

export const registerSchema = userInsertBaseSchema.extend({
  confirmPassword: userInsertBaseSchema.shape.password,
  birthDate: birthDateSchema,
}).omit({
  id: true,
})
  .partial()
  .refine(({ password, confirmPassword }) => !confirmPassword || !password || confirmPassword === password, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"]
  })

// ─── USUÁRIO COMPLETO COM RELACIONAMENTOS (SESSÃO) ─────────────────────────
export const userWithRelationsSchema = userSelectBaseSchema.extend({
  categories: z.array(categorySelectSchema).optional(),
  emotions: z.array(emotionSelectSchema).optional(),
  thoughts: z.array(thoughtSelectSchema).optional(),
  reactions: z.array(reactionSelectSchema).optional(),
  behaviors: z.array(behaviorSelectSchema).optional(),
  moods: z.array(moodSelectSchema).optional(),
  profileImages: z.array(profileImageSelectSchema).optional(),
  notes: z.array(noteSelectSchema).optional(),
});
