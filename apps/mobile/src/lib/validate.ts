import type { z } from "zod/v4";
import { ValidationExceptionFilter } from "@/lib/exceptions/validation/filter.exception";
import { useToastStore } from "@/stores/toast-store";

export async function validate<T extends { input: unknown; output: unknown }, R = unknown>(
  schema: z.ZodType<T["output"], T["input"]>,
  formData: T["input"],
  callback: (data: T["output"]) => R | Promise<R>,
): Promise<Awaited<R>> {
  try {
    const result = schema.safeParse(formData);

    if (!result.success) {
      throw ValidationExceptionFilter.from(result.error);
    }

    return await callback(result.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao validar os dados.";
    useToastStore.getState().showError(message, error);
    throw error;
  }
}
