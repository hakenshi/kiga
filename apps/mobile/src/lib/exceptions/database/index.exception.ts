import { AppException } from "@/lib/exceptions/app/index.exception";

export class DatabaseException extends AppException {
  readonly code = "DATABASE_ERROR";
}
