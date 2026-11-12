import { AppException } from "@/lib/exceptions/app/index.exception";

export class ConflictException extends AppException {
  readonly code = "CONFLICT";
}
