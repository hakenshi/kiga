import { createContext, use, type PropsWithChildren } from "react";
import { ProviderException } from "@/lib/exceptions/provider/index.exception";
import { useStore } from "zustand";
import type { ComposerSlice, ComposerStore } from "./composer-slice";

/**
 * Contrato que qualquer fluxo de escrita implementa.
 * - `store`: estado + ações de edição (Zustand; lido por seletor para evitar re-render).
 * - `actions`: o que muda de um fluxo para outro (salvar, fechar).
 */
export interface ComposerActionsContract {
  submit: () => Promise<void>;
  close: () => void;
}

interface ComposerContextValue {
  store: ComposerStore;
  actions: ComposerActionsContract;
}

const ComposerContext = createContext<ComposerContextValue | null>(null);

interface ComposerProviderProps extends PropsWithChildren {
  store: ComposerStore;
  actions: ComposerActionsContract;
}

/** Base genérica. Telas usam os providers específicos (`NewPostComposerProvider`...). */
export function ComposerProvider({ store, actions, children }: ComposerProviderProps) {
  return <ComposerContext value={{ store, actions }}>{children}</ComposerContext>;
}

function useComposerContext(): ComposerContextValue {
  const ctx = use(ComposerContext);
  if (!ctx) {
    throw new ProviderException("Componentes do Composer precisam estar dentro de um provider de composer.");
  }
  return ctx;
}

/** Lê um pedaço do estado do composer atual. */
export function useComposer<T>(selector: (s: ComposerSlice) => T): T {
  return useStore(useComposerContext().store, selector);
}

/** Ações do fluxo (salvar, fechar). */
export function useComposerActions(): ComposerActionsContract {
  return useComposerContext().actions;
}
