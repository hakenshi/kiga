import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { DatabaseExceptionFilter } from "@/lib/exceptions/database/filter.exception";
import { ValidationExceptionFilter } from "@/lib/exceptions/validation/filter.exception";
import { useToastStore } from "@/stores/toast-store";

function showError(error: unknown) {
  const exception = error instanceof z.ZodError
    ? ValidationExceptionFilter.from(error)
    : DatabaseExceptionFilter.from(error);
  useToastStore.getState().showError(exception.message, exception);
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { networkMode: "always", retry: false, staleTime: Infinity },
      mutations: { networkMode: "always", retry: false },
    },
    queryCache: new QueryCache({ onError: showError }),
    mutationCache: new MutationCache({ onError: showError }),
  });
}

export const queryClient = createQueryClient();

export function readInitialData<T>(read: () => T): T | undefined {
  try {
    return read();
  } catch {
    // Deixa o queryFn encaminhar a falha ao tratamento de erros do React Query.
    return undefined;
  }
}
