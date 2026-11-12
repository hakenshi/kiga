import { z } from "zod";
import { ValidationException } from "./index.exception";

export class ValidationExceptionFilter {
  public static from(err: z.ZodError): ValidationException {
    for (const issue of err.issues) {
      if (issue.message) {
        return new ValidationException(issue.message, err.issues);
      }
    }

    return new ValidationException(
      "Os dados informados não atendem aos critérios de validação.",
      err.issues
    );
  }
}
