import { AppException } from "@/lib/exceptions/app/index.exception";

export class ProviderException extends AppException {
  readonly code = "PROVIDER_ERROR";
}
