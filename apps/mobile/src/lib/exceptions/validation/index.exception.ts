import { AppException } from "@/lib/exceptions/app/index.exception";

export class ValidationException extends AppException {
  readonly code = "VALIDATION_ERROR";
}
