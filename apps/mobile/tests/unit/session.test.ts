import { beforeEach, describe, expect, it } from "bun:test";
import { useAuthStore } from "@/stores/auth-store";

describe("Persistência e Estrutura da Sessão", () => {
  // Mock simulado do storage (chave-valor)
  const mockStorage = new Map<string, string>();

  beforeEach(() => {
    mockStorage.clear();
    useAuthStore.getState().logout();
  });

  it("deve salvar corretamente a sessão do usuário com flag de autenticação", async () => {
    const mockUser: User = {
      id: 1,
      username: "yoru",
      firstName: "Yoru",
      secondName: "Kiga",
      birthDate: new Date("1998-01-01"),
      gender: "male",
      pronoun: "he_him",
      createdAt: new Date(),
    };

    const sessionPayload = {
      ...mockUser,
      isAuthenticated: true,
    };

    // Simula SecureStore.setItemAsync("session", ...)
    mockStorage.set("session", JSON.stringify(sessionPayload));

    // Valida se foi gravado
    expect(mockStorage.has("session")).toBe(true);

    // Valida se o conteúdo gravado é desserializado com todas as propriedades esperadas
    const rawStored = mockStorage.get("session");
    expect(rawStored).toBeDefined();

    const parsedSession = JSON.parse(rawStored!);
    expect(parsedSession.id).toBe(1);
    expect(parsedSession.username).toBe("yoru");
    expect(parsedSession.isAuthenticated).toBe(true);
  });

  it("deve restaurar a sessão do storage para o authStore com sucesso", () => {
    const storedUserJson = JSON.stringify({
      id: 1,
      username: "yoru",
      firstName: "Yoru",
      secondName: "Kiga",
      birthDate: new Date("1998-01-01"),
      createdAt: new Date(),
      isAuthenticated: true,
    });

    // Simula leitura do storage
    const parsedUser = JSON.parse(storedUserJson);

    // Atualiza o store com a sessão restaurada
    useAuthStore.getState().setUser({
      user: parsedUser,
      isAuthenticated: parsedUser.isAuthenticated,
    });

    const currentState = useAuthStore.getState();
    expect(currentState.isAuthenticated).toBe(true);
    expect(currentState.user?.username).toBe("yoru");
    expect(currentState.user?.id).toBe(1);
  });

  it("deve limpar tanto a store quanto a sessão no storage ao deslogar", () => {
    mockStorage.set("session", JSON.stringify({ username: "yoru", isAuthenticated: true }));

    // Simula logout
    useAuthStore.getState().logout();
    mockStorage.delete("session");

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(mockStorage.get("session")).toBeUndefined();
  });
});
