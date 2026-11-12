import { AppException } from "@/lib/exceptions/app/index.exception";

export class ForbiddenException extends AppException {
  readonly code = "FORBIDDEN";
}
