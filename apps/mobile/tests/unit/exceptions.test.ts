import { describe, expect, it } from "bun:test";
import { z } from "zod";
import { AppException } from "@/lib/exceptions/app/index.exception";
import { ConflictException } from "@/lib/exceptions/conflict/index.exception";
import { DatabaseException } from "@/lib/exceptions/database/index.exception";
import { DatabaseExceptionFilter } from "@/lib/exceptions/database/filter.exception";
import { ForbiddenException } from "@/lib/exceptions/forbidden/index.exception";
import { NotFoundException } from "@/lib/exceptions/not-found/index.exception";
import { ProviderException } from "@/lib/exceptions/provider/index.exception";
import { ValidationException } from "@/lib/exceptions/validation/index.exception";
import { ValidationExceptionFilter } from "@/lib/exceptions/validation/filter.exception";

describe("Exceptions Architecture", () => {
  it("deve instanciar exceções com propriedades e códigos corretos", () => {
    const validation = new ValidationException("Dado inválido");
    expect(validation).toBeInstanceOf(AppException);
    expect(validation.code).toBe("VALIDATION_ERROR");
    expect(validation.message).toBe("Dado inválido");

    const notFound = new NotFoundException("Registro não encontrado");
    expect(notFound.code).toBe("NOT_FOUND");

    const conflict = new ConflictException("Conflito detectado");
    expect(conflict.code).toBe("CONFLICT");

    const forbidden = new ForbiddenException("Ação não permitida");
    expect(forbidden.code).toBe("FORBIDDEN");

    const database = new DatabaseException("Erro no banco");
    expect(database.code).toBe("DATABASE_ERROR");

    const provider = new ProviderException("Provider ausente");
    expect(provider).toBeInstanceOf(AppException);
    expect(provider.code).toBe("PROVIDER_ERROR");

  });

  it("deve converter erros de validação preservando os detalhes", () => {
    const result = z.string().min(3, "Texto muito curto").safeParse("a");
    if (result.success) throw new Error("A validação deveria falhar");

    const exception = ValidationExceptionFilter.from(result.error);
    expect(exception).toBeInstanceOf(ValidationException);
    expect(exception.message).toBe("Texto muito curto");
    expect(exception.details).toBe(result.error.issues);
  });

  it("deve retornar a própria exceção se já for uma instância de AppException", () => {
    const original = new NotFoundException("Item inexistente");
    const filtered = DatabaseExceptionFilter.from(original);
    expect(filtered).toBe(original);
  });

  it("deve converter ZodError em ValidationException com mensagens legíveis", () => {
    const schema = z.object({
      title: z.string().min(3, "O título deve ter no mínimo 3 caracteres"),
      age: z.number({ message: "A idade deve ser um número" }),
    });

    const parsed = schema.safeParse({ title: "a", age: "not-a-number" });
    expect(parsed.success).toBe(false);

    if (!parsed.success) {
      const exception = ValidationExceptionFilter.from(parsed.error);
      expect(exception).toBeInstanceOf(ValidationException);
      expect(exception.code).toBe("VALIDATION_ERROR");
      expect(exception.message).toContain("O título deve ter no mínimo 3 caracteres");
      expect(exception.message).not.toContain("A idade deve ser um número");
      expect(exception.details).toBe(parsed.error.issues);
    }
  });

  it("deve converter erro de constraint UNIQUE do SQLite em ConflictException", () => {
    const userErr = new Error("UNIQUE constraint failed: users.username");
    const userResult = DatabaseExceptionFilter.from(userErr);
    expect(userResult).toBeInstanceOf(ConflictException);
    expect(userResult.message).toBe("O nome de usuário informado já está cadastrado em outra conta.");

    const entryEmotionErr = new Error("UNIQUE constraint failed: entry_emotions.entry_id, entry_emotions.emotion_id");
    const entryResult = DatabaseExceptionFilter.from(entryEmotionErr);
    expect(entryResult).toBeInstanceOf(ConflictException);
    expect(entryResult.message).toBe("Esta emoção já foi vinculada a este relato.");

    const genericUniqueErr = new Error("UNIQUE constraint failed: custom_table.field");
    const genericResult = DatabaseExceptionFilter.from(genericUniqueErr);
    expect(genericResult).toBeInstanceOf(ConflictException);
    expect(genericResult.message).toBe("Este registro já existe e não pode ser duplicado.");

    const unrelated = DatabaseExceptionFilter.from(new Error("Falha ao acessar entry_emotions"));
    expect(unrelated).toBeInstanceOf(DatabaseException);
  });

  it("deve converter erro de integridade referencial FOREIGN KEY em DatabaseException explicativa", () => {
    const fkErr = new Error("FOREIGN KEY constraint failed");
    const result = DatabaseExceptionFilter.from(fkErr);
    expect(result).toBeInstanceOf(DatabaseException);
    expect(result.message).toBe("Não foi possível concluir a operação por causa de um vínculo entre registros.");
  });

  it("deve converter erro de banco ocupado em mensagem clara para o usuário", () => {
    const busyErr = new Error("sqlite_busy: database is locked");
    const result = DatabaseExceptionFilter.from(busyErr);
    expect(result).toBeInstanceOf(DatabaseException);
    expect(result.message).toBe("O banco de dados está ocupado no momento. Tente novamente em instantes.");
  });

  it("deve converter erro de falta de espaço em disco em mensagem clara", () => {
    const diskErr = new Error("ENOSPC: no space left on device");
    const result = DatabaseExceptionFilter.from(diskErr);
    expect(result).toBeInstanceOf(DatabaseException);
    expect(result.message).toBe("Não há espaço suficiente para salvar as informações no banco de dados.");
  });
});
