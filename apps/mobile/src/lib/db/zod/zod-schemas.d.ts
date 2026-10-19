import z from "zod";
import { loginSchema, registerSchema, userSelectBaseSchema } from "./zod-schemas.ts"

type User = z.infer<typeof userSelectBaseSchema>
type LoginSchema = z.infer<typeof loginSchema>
type registerSchema = z.infer<typeof registerSchema>
