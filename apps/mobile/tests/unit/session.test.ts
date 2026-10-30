import { beforeEach, describe, expect, it } from "bun:test";
import { useAuthStore } from "@/stores/auth-store";
import { appStorage } from "@/lib/storage";

describe("Persistência e Estrutura da Sessão com Zustand Persist", () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it("deve salvar e persistir corretamente a sessão do usuário ao chamar setUser", () => {
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

    useAuthStore.getState().setUser({ user: mockUser, isAuthenticated: true });

    // Valida estado na store
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.username).toBe("yoru");
    expect(state.user?.id).toBe(1);

    // Valida se o middleware persist gravou no storage
    const rawPersisted = appStorage.getItem("auth-session") as string | null;
    expect(rawPersisted).not.toBeNull();

    const parsed = JSON.parse(rawPersisted!);
    expect(parsed.state.isAuthenticated).toBe(true);
    expect(parsed.state.user.username).toBe("yoru");
  });

  it("deve limpar tanto a store quanto a persistência ao deslogar", () => {
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

    useAuthStore.getState().setUser({ user: mockUser, isAuthenticated: true });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    // Executa logout
    useAuthStore.getState().logout();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();

    // Valida se a chave persistida refletiu o estado deslogado
    const rawPersisted = appStorage.getItem("auth-session") as string | null;
    if (rawPersisted) {
      const parsed = JSON.parse(rawPersisted);
      expect(parsed.state.isAuthenticated).toBe(false);
      expect(parsed.state.user).toBeNull();
    }
  });
});
