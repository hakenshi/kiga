import { afterEach, beforeEach, describe, expect, jest, mock, test } from "bun:test";
import { useToastStore } from "../../src/stores/toast-store";

beforeEach(() => {
  useToastStore.getState().dismiss();
  jest.useFakeTimers();
});

afterEach(() => {
  useToastStore.getState().dismiss();
  jest.useRealTimers();
});

describe("avisos ao usuário", () => {
  test("informação desaparece no prazo padrão", () => {
    useToastStore.getState().showInfo("Salvo");
    expect(useToastStore.getState().currentToast).toMatchObject({ type: "info", message: "Salvo", duration: 3000 });
    jest.advanceTimersByTime(2999);
    expect(useToastStore.getState().currentToast).not.toBeNull();
    jest.advanceTimersByTime(1);
    expect(useToastStore.getState().currentToast).toBeNull();
  });

  test("erro inclui mensagem legível, detalhes técnicos e prazo próprio", () => {
    useToastStore.getState().showError("Falha ao salvar", new Error("SQLITE_BUSY"));
    expect(useToastStore.getState().currentToast).toMatchObject({
      type: "error", message: "Banco de dados ocupado em segundo plano. Tente novamente em instantes.",
      technicalDetails: "SQLITE_BUSY", duration: 5000,
    });
    jest.advanceTimersByTime(5000);
    expect(useToastStore.getState().currentToast).toBeNull();
  });

  test("um aviso novo cancela o prazo do anterior", () => {
    useToastStore.getState().showInfo("Primeiro", 1000);
    jest.advanceTimersByTime(500);
    useToastStore.getState().showInfo("Segundo", 3000);
    jest.advanceTimersByTime(500);
    expect(useToastStore.getState().currentToast?.message).toBe("Segundo");
    jest.advanceTimersByTime(2500);
    expect(useToastStore.getState().currentToast).toBeNull();
  });

  test("a ação não executa automaticamente ao expirar", () => {
    const action = mock(() => {});
    useToastStore.getState().showAction("Nota excluída", "Desfazer", action);
    expect(useToastStore.getState().currentToast).toMatchObject({
      type: "action", actionLabel: "Desfazer", duration: 4500, onAction: action,
    });
    jest.advanceTimersByTime(4500);
    expect(action).not.toHaveBeenCalled();
    expect(useToastStore.getState().currentToast).toBeNull();
  });

  test("dismiss cancela o aviso e permite mostrar outro com prazo independente", () => {
    useToastStore.getState().showInfo("Primeiro", 1000);
    useToastStore.getState().dismiss();
    useToastStore.getState().showAction("Segundo", "Ação", () => {}, 2000);
    jest.advanceTimersByTime(1000);
    expect(useToastStore.getState().currentToast?.message).toBe("Segundo");
    jest.advanceTimersByTime(1000);
    expect(useToastStore.getState().currentToast).toBeNull();
  });
});
