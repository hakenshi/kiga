import db from "@/lib/db";
import { DatabaseException } from "@/lib/exceptions/database/index.exception";
import { NotFoundException } from "@/lib/exceptions/not-found/index.exception";
import { users } from "@/lib/db/schema";
import {
  userInsertBaseSchema,
  userUpdateSchema,
} from "@/lib/db/zod/schemas/auth.schema";
import { eq } from "drizzle-orm";
import { BaseRepository } from "./base-repository";

export class AuthRepository extends BaseRepository {
  public static register(data: UserInsertBase) {
    return db.transaction((tx) => {
      const [newUser] = this.insert(tx, data, userInsertBaseSchema, users);

      if (!newUser) {
        throw new DatabaseException("Falha ao registrar usuário");
      }

      return newUser;
    });
  }

  public static async findByUsername(username: string) {
    return db.query.users.findFirst({
      where: eq(users.username, username),
      with: {
        emotions: true,
        moods: true,
        profileImages: true,
        reactions: true,
        thoughts: true,
      },
    });
  }

  public static async findById(id: number) {
    return db.query.users.findFirst({
      where: eq(users.id, id),
      with: {
        emotions: true,
        moods: true,
        profileImages: true,
        reactions: true,
        thoughts: true,
      },
    });
  }

  public static updateProfile(id: number, data: UserUpdate) {
    const safeData = userUpdateSchema.safeParse(data);
    if (!safeData.success) {
      throw safeData.error;
    }

    return db.transaction((tx) => {
      const [updated] = tx
        .update(users)
        .set(safeData.data)
        .where(eq(users.id, id))
        .returning()
        .all();

      if (!updated) {
        throw new NotFoundException("Não foi possível atualizar o perfil: usuário não encontrado.");
      }

      return updated;
    });
  }

  public static async deleteAccount(id: number) {
    return await db.delete(users).where(eq(users.id, id)).returning();
  }
}
