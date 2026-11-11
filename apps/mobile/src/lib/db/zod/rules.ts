import db from "@/lib/db";
import { eq, inArray } from "drizzle-orm";
import type { SQLiteColumn, SQLiteTable } from "drizzle-orm/sqlite-core";
import type { z } from "zod";

/**
 * Valida se um ID existe em uma coluna de uma tabela SQLite.
 */
export async function validateExists(
  table: SQLiteTable,
  column: SQLiteColumn,
  value: number | string | null | undefined,
  ctx: z.RefinementCtx,
  path?: (string | number)[],
  message = "Registro não encontrado"
): Promise<void> {
  if (value === null || value === undefined) return;

  const result = await db
    .select({ id: column })
    .from(table)
    .where(eq(column, value))
    .limit(1);

  if (result.length === 0) {
    ctx.addIssue({
      code: "custom",
      ...(path ? { path } : {}),
      message,
    });
  }
}

/**
 * Valida se todos os IDs de uma lista não contêm duplicados
 * e existem na coluna da tabela SQLite informada.
 */
export async function validateAllExist(
  table: SQLiteTable,
  column: SQLiteColumn,
  values: (number | string)[] | null | undefined,
  ctx: z.RefinementCtx,
  path?: (string | number)[],
  message = "Um ou mais registros não foram encontrados"
): Promise<void> {
  if (!values || values.length === 0) return;

  const unique = Array.from(new Set(values));
  if (unique.length !== values.length) {
    ctx.addIssue({
      code: "custom",
      ...(path ? { path } : {}),
      message: "A lista contém itens duplicados",
    });
    return;
  }

  const result = await db
    .select({ id: column })
    .from(table)
    .where(inArray(column, unique));

  if (result.length !== unique.length) {
    ctx.addIssue({
      code: "custom",
      ...(path ? { path } : {}),
      message,
    });
  }
}
