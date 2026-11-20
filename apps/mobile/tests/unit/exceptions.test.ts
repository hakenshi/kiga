import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { AppException } from "../../src/lib/exceptions/app/index.exception";
import { ConflictException } from "../../src/lib/exceptions/conflict/index.exception";
import { DatabaseExceptionFilter } from "../../src/lib/exceptions/database/filter.exception";
import { DatabaseException } from "../../src/lib/exceptions/database/index.exception";
import { ValidationExceptionFilter } from "../../src/lib/exceptions/validation/filter.exception";
import { ValidationException } from "../../src/lib/exceptions/validation/index.exception";
import { formatAppError } from "../../src/lib/error-formatter";

describe("filtro de erros do banco", () => {
  test("preserva uma exception já tipada, incluindo seus detalhes", () => {
    const error = new ConflictException("Já existe", { field: "username" });
    expect(DatabaseExceptionFilter.from(error)).toBe(error);
    expect(error).toBeInstanceOf(AppException);
    expect(error.name).toBe("ConflictException");
  });

  test.each([
    ["users.username", "O nome de usuário informado já está cadastrado em outra conta."],
    ["note_emotions.noteId", "Esta emoção já foi vinculada a esta nota."],
    ["note_behaviors.noteId", "Este comportamento já foi vinculado a esta nota."],
    ["note_reactions.noteId", "Esta reação já foi vinculada a esta nota."],
    ["note_thoughts.noteId", "Este pensamento já foi vinculado a esta nota."],
    ["outra_tabela.id", "Este registro já existe e não pode ser duplicado."],
  ])("identifica conflito em %s", (column, message) => {
    const raw = `UNIQUE constraint failed: ${column}`;
    const error = DatabaseExceptionFilter.from(new Error(raw));
    expect(error).toBeInstanceOf(ConflictException);
    expect(error.message).toBe(message);
    expect(error.details).toBe(raw);
  });

  test.each([
    ["FOREIGN KEY constraint failed", "Não foi possível concluir a operação por causa de um vínculo entre registros."],
    ["SQLITE_BUSY", "O banco de dados está ocupado no momento. Tente novamente em instantes."],
    ["database is locked", "O banco de dados está ocupado no momento. Tente novamente em instantes."],
    ["ENOSPC", "Não há espaço suficiente para salvar as informações no banco de dados."],
    ["SQLITE_FULL", "Não há espaço suficiente para salvar as informações no banco de dados."],
  ])("converte %s sem perder detalhes", (raw, message) => {
    const error = DatabaseExceptionFilter.from(raw);
    expect(error).toBeInstanceOf(DatabaseException);
    expect(error.message).toBe(message);
    expect(error.details).toBe(raw);
  });

  test("não atribui causa específica a um erro desconhecido", () => {
    expect(DatabaseExceptionFilter.from({ inesperado: true }).message).toBe("Erro inesperado de banco de dados");
    expect(DatabaseExceptionFilter.from(new Error("erro desconhecido")).message).toBe("erro desconhecido");
  });
});

describe("filtro de validação", () => {
  test("mostra somente o primeiro erro e mantém as issues como detalhes", () => {
    const result = z.object({
      first: z.string().min(1, "Primeiro erro"),
      second: z.string().min(1, "Segundo erro"),
    }).safeParse({ first: "", second: "" });
    if (result.success) throw new Error("A validação deveria falhar");
    const error = ValidationExceptionFilter.from(result.error);
    expect(error).toBeInstanceOf(ValidationException);
    expect(error.message).toBe("Primeiro erro");
    expect(error.details).toEqual(result.error.issues);
  });

  test("usa mensagem genérica quando não há issues", () => {
    expect(ValidationExceptionFilter.from(new z.ZodError([])).message)
      .toBe("Os dados informados não atendem aos critérios de validação.");
  });
});

describe("mensagens de erro ao usuário", () => {
  test.each([
    ["ENOSPC", "Armazenamento do celular insuficiente para concluir a operação."],
    ["SQLITE_BUSY", "Banco de dados ocupado em segundo plano. Tente novamente em instantes."],
    ["FOREIGN KEY constraint failed", "Não foi possível vincular as tags a esta entrada."],
    ["ENOENT", "Arquivo de imagem não encontrado ou removido da galeria."],
    ["EACCES", "Permissão negada para acessar as fotos ou armazenamento."],
  ])("formata %s", (raw, message) => {
    expect(formatAppError(new Error(raw))).toEqual({ message, technicalDetails: raw });
  });

  test("preserva erros curtos e usa fallback para detalhes técnicos extensos", () => {
    expect(formatAppError(new Error("Nome inválido"))).toEqual({
      message: "Nome inválido",
      technicalDetails: "Nome inválido",
    });
    const raw = "x".repeat(100);
    expect(formatAppError(new Error(raw), "Falha ao salvar")).toEqual({
      message: "Falha ao salvar",
      technicalDetails: raw,
    });
    expect(formatAppError(undefined, "Falha ao salvar")).toEqual({ message: "Falha ao salvar" });
    expect(formatAppError({ code: 42 }, "Falha ao salvar")).toEqual({
      message: "Falha ao salvar",
      technicalDetails: '{"code":42}',
    });
  });
});
