import type { z } from "zod/v4";
import type {
  loginSchema,
  profileImageInsertSchema,
  profileImageSelectSchema,
  registerSchema,
  userInsertBaseSchema,
  userInsertSchema,
  userSelectBaseSchema,
  userUpdateSchema,
  userWithRelationsSchema,
} from "../schemas/auth.schema";

declare global {
  interface Buffer extends Uint8Array { }

  type UserBase = z.infer<typeof userSelectBaseSchema>;
  type UserInsertBase = z.infer<typeof userInsertBaseSchema>;
  type UserInsert = z.infer<typeof userInsertSchema>;
  type UserUpdate = z.infer<typeof userUpdateSchema>;
  type ProfileImage = z.infer<typeof profileImageSelectSchema>;
  type ProfileImageInsert = z.infer<typeof profileImageInsertSchema>;
  type UserWithRelations = z.infer<typeof userWithRelationsSchema>;
  type User = UserWithRelations;

  type LoginSchema = z.infer<typeof loginSchema>;
  type RegisterSchema = {
    input: z.input<typeof registerSchema>
    output: z.output<typeof registerSchema>
    full: z.infer<typeof registerSchema>
  }
}
