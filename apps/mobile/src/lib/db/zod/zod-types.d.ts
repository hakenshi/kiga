import type { z } from "zod";
import type {
  loginSchema,
  registerIdentitySchema,
  registerNameSchema,
  registerPinSchema,
  registerSchema,
  registerSecuritySchema,
  userSelectBaseSchema,
  userInsertBaseSchema,
} from "./zod-schemas";

declare global {
  interface Buffer extends Uint8Array {}
  type User = z.infer<typeof userSelectBaseSchema>;
  type UserInsert = z.infer<typeof userInsertBaseSchema>;
  type LoginSchema = z.infer<typeof loginSchema>;
  type RegisterSchema = z.infer<typeof registerSchema>;
  type registerSchema = RegisterSchema;

  type RegisterNameInput = z.input<typeof registerNameSchema>;
  type RegisterNameSchema = z.infer<typeof registerNameSchema>;

  type RegisterSecurityInput = z.input<typeof registerSecuritySchema>;
  type RegisterSecuritySchema = z.infer<typeof registerSecuritySchema>;

  type RegisterIdentitySchema = z.infer<typeof registerIdentitySchema>;
  type RegisterPinSchema = z.infer<typeof registerPinSchema>;
}
