import { AppException } from "@/lib/exceptions/app/index.exception";
import { ConflictException } from "@/lib/exceptions/conflict/index.exception";
import { DatabaseException } from "./index.exception";

export class DatabaseExceptionFilter {
  public static from(err: unknown): AppException {
    if (err instanceof AppException) return err;

    if (typeof err !== "string" && !(err instanceof Error)) {
      return new DatabaseException("Erro inesperado de banco de dados");
    }

    let rawMessage = err;
    if (err instanceof Error) {
      rawMessage = err.message;
    }
    const lower = rawMessage.toLowerCase();

    if (lower.includes("unique constraint failed") && lower.includes("users.username")) {
      return new ConflictException(
        "O nome de usuário informado já está cadastrado em outra conta.",
        rawMessage
      );
    }

    if (lower.includes("unique constraint failed") && lower.includes("entry_emotions")) {
      return new ConflictException(
        "Esta emoção já foi vinculada a este relato.",
        rawMessage
      );
    }

    if (lower.includes("unique constraint failed") && lower.includes("entry_behaviors")) {
      return new ConflictException(
        "Este comportamento já foi vinculado a este relato.",
        rawMessage
      );
    }

    if (lower.includes("unique constraint failed") && lower.includes("entry_reactions")) {
      return new ConflictException(
        "Esta reação já foi vinculada a este relato.",
        rawMessage
      );
    }

    if (lower.includes("unique constraint failed") && lower.includes("entry_thoughts")) {
      return new ConflictException(
        "Este pensamento já foi vinculado a este relato.",
        rawMessage
      );
    }

    if (lower.includes("unique constraint failed")) {
      return new ConflictException(
        "Este registro já existe e não pode ser duplicado.",
        rawMessage
      );
    }

    if (lower.includes("foreign key constraint failed")) {
      return new DatabaseException(
        "Não foi possível concluir a operação por causa de um vínculo entre registros.",
        rawMessage
      );
    }

    if (lower.includes("sqlite_busy") || lower.includes("locked")) {
      return new DatabaseException(
        "O banco de dados está ocupado no momento. Tente novamente em instantes.",
        rawMessage
      );
    }

    if (lower.includes("enospc") || lower.includes("sqlite_full") || lower.includes("database or disk is full")) {
      return new DatabaseException(
        "Não há espaço suficiente para salvar as informações no banco de dados.",
        rawMessage
      );
    }

    return new DatabaseException(
      rawMessage as string
    );
  }
}
