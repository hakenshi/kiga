import type { z } from "zod/v4";
import type {
  birthDateSchema,
  loginSchema,
  profileImageInsertSchema,
  profileImageSelectSchema,
  registerIdentitySchema,
  registerNameSchema,
  registerPinSchema,
  registerSchema,
  registerSecuritySchema,
  userInsertBaseSchema,
  userInsertSchema,
  userSelectBaseSchema,
  userWithRelationsSchema,
} from "../schemas/auth.schema";

declare global {
  interface Buffer extends Uint8Array { }

  type UserBase = z.infer<typeof userSelectBaseSchema>;
  type UserInsertBase = z.infer<typeof userInsertBaseSchema>;
  type UserInsert = z.infer<typeof userInsertSchema>;
  type ProfileImage = z.infer<typeof profileImageSelectSchema>;
  type ProfileImageInsert = z.infer<typeof profileImageInsertSchema>;
  type UserWithRelations = z.infer<typeof userWithRelationsSchema>;
  type User = UserWithRelations;

  type LoginSchema = z.infer<typeof loginSchema>;
  type RegisterSchema = z.infer<typeof registerSchema>;
  type RegisterNameInput = z.input<typeof registerNameSchema>;
  type RegisterNameSchema = z.infer<typeof registerNameSchema>;
  type RegisterSecurityInput = z.input<typeof registerSecuritySchema>;
  type RegisterSecuritySchema = z.infer<typeof registerSecuritySchema>;
  type RegisterIdentitySchema = z.infer<typeof registerIdentitySchema>;
  type RegisterPinSchema = z.infer<typeof registerPinSchema>;
}
