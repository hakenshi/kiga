import { beforeEach, describe, expect, it } from "bun:test";
import { useAuthStore } from "@/stores/auth-store";

describe("useAuthStore", () => {
  beforeEach(() => {
    // Reseta o estado antes de cada teste
    useAuthStore.getState().logout();
  });

  it("deve inicializar com o usuário nulo e não autenticado", () => {
    const { user, isAuthenticated } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(isAuthenticated).toBe(false);
  });

  it("deve atualizar o usuário e definir isAuthenticated como true com setUser", () => {
    const mockUser: User = {
      id: 1,
      username: "johndoe",
      firstName: "John",
      secondName: "Doe",
      birthDate: new Date("1995-05-15"),
      gender: "male",
      pronoun: "he_him",
      createdAt: new Date(),
    };

    useAuthStore.getState().setUser({ user: mockUser, isAuthenticated: true });

    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().user?.username).toBe("johndoe");
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it("deve limpar o usuário e definir isAuthenticated como false com logout", () => {
    const mockUser: User = {
      id: 1,
      username: "johndoe",
      firstName: "John",
      secondName: "Doe",
      birthDate: new Date("1995-05-15"),
      gender: "male",
      pronoun: "he_him",
      createdAt: new Date(),
    };

    useAuthStore.getState().setUser({ user: mockUser, isAuthenticated: true });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    useAuthStore.getState().logout();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("deve atualizar campos parciais do usuário logado com updateUser", () => {
    const mockUser: User = {
      id: 1,
      username: "johndoe",
      firstName: "John",
      secondName: "Doe",
      birthDate: new Date("1995-05-15"),
      gender: "male",
      pronoun: "he_him",
      createdAt: new Date(),
    };

    useAuthStore.getState().setUser({ user: mockUser, isAuthenticated: true });

    // Atualização com objeto parcial
    useAuthStore.getState().updateUser({ firstName: "Johnny" });
    expect(useAuthStore.getState().user?.firstName).toBe("Johnny");
    expect(useAuthStore.getState().user?.username).toBe("johndoe");

    // Atualização de outro campo parcial
    useAuthStore.getState().updateUser({
      emotions: [{ id: 10, name: "Empolgação", categoryId: null, orderIndex: 1, deletedAt: null, userId: 1 }],
    });

    expect(useAuthStore.getState().user?.emotions?.length).toBe(1);
    expect(useAuthStore.getState().user?.emotions?.[0].name).toBe("Empolgação");
  });
});
