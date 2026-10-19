import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { users } from "../schema"
import { z } from "zod/v4"

export const userSelectBaseSchema = createSelectSchema(users).pick({
  username: true,
  password: true,
  pin: true,
  birthDate: true,
  firstName: true,
  secondName: true,
})
export const userInsertBaseSchema = createInsertSchema(users, {
  username: s => s.min(3),
  password: s => s.min(3),
  pin: s => s.min(4).max(6),
  firstName: s => s.min(3),
  secondName: s => s.min(3),
})

export const userInsterSchema = userInsertBaseSchema.transform((data) => ({
  username: data.username.trim(),
  password: data.password.trim(),
  firstName: data.firstName.trim(),
  secondName: data.secondName.trim(),
}))

export const loginSchema = createSelectSchema(users).pick({ username: true, password: true, pin: true })

export const registerSchema = userInsertBaseSchema
  .extend({
    confirmPassword: z.string().min(3),
  })
  .refine(
    d => d.password.toLowerCase().trim() === d.confirmPassword.toLowerCase().trim(),
    {
      message: "As senhas não coincidem",
      path: ["confirmPassword"]
    }
  )
