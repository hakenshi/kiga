import { beforeEach, describe, expect, test } from "bun:test";
import { z } from "zod";
import { users } from "../../src/lib/db/schema";
import { validateAllExist, validateExists } from "../../src/lib/db/zod/rules";
import { resetDatabase } from "../helpers/database";
import { seedUsers } from "../helpers/seed";

beforeEach(resetDatabase);

describe("validação de vínculos existentes no SQLite", () => {
  test("aceita um registro existente e devolve caminho e mensagem para ID ausente", async () => {
    const { owner } = seedUsers();
    const schema = z.number().superRefine((value, ctx) =>
      validateExists(users, users.id, value, ctx, ["userId"], "Usuário não encontrado"),
    );
    expect(await schema.safeParseAsync(owner.id)).toMatchObject({ success: true });
    const result = await schema.safeParseAsync(9999);
    if (result.success) throw new Error("O vínculo deveria ser inválido");
    expect(result.error.issues).toMatchObject([{ path: ["userId"], message: "Usuário não encontrado" }]);
  });

  test.each([null, undefined])("não exige uma relação opcional %j", async (value) => {
    const schema = z.number().nullish().superRefine((id, ctx) => validateExists(users, users.id, id, ctx));
    expect((await schema.safeParseAsync(value)).success).toBe(true);
  });

  test("valida todos os IDs e rejeita duplicados antes de tratar IDs ausentes", async () => {
    const { owner, other } = seedUsers();
    const schema = z.array(z.number()).superRefine((ids, ctx) => validateAllExist(users, users.id, ids, ctx, ["ids"]));
    expect((await schema.safeParseAsync([owner.id, other.id])).success).toBe(true);
    expect((await schema.safeParseAsync([])).success).toBe(true);
    const duplicate = await schema.safeParseAsync([9999, 9999]);
    if (duplicate.success) throw new Error("Duplicados deveriam ser inválidos");
    expect(duplicate.error.issues).toMatchObject([{ path: ["ids"], message: "A lista contém itens duplicados" }]);
    const missing = await schema.safeParseAsync([owner.id, 9999]);
    if (missing.success) throw new Error("O vínculo deveria ser inválido");
    expect(missing.error.issues).toMatchObject([{ path: ["ids"], message: "Um ou mais registros não foram encontrados" }]);
  });
});
