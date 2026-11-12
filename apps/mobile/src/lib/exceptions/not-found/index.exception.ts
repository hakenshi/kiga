import { AppException } from "@/lib/exceptions/app/index.exception";

export class NotFoundException extends AppException {
  readonly code = "NOT_FOUND";
}
