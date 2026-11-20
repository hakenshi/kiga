import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { useAuthStore } from "../../src/stores/auth-store";
import { useRegisterStore } from "../../src/stores/register-store";
import { storageValues } from "../helpers/storage";
import { user } from "../helpers/fixtures";
import { queryClient } from "../../src/lib/query-client";
import { noteKeys } from "../../src/queries/notes/queries";

beforeEach(() => {
  storageValues.clear();
  useAuthStore.getState().logout();
  useRegisterStore.getState().reset();
});

afterEach(() => {
  useAuthStore.getState().logout();
  useRegisterStore.getState().reset();
  storageValues.clear();
});

describe("sessão local", () => {
  test("autentica, persiste e restaura a sessão sem substituir suas ações", async () => {
    useAuthStore.getState().setUser({ user, isAuthenticated: true });
    const saved = storageValues.get("auth-session");
    if (!saved) throw new Error("A sessão deveria ser persistida");
    useAuthStore.getState().logout();
    storageValues.set("auth-session", saved);
    await useAuthStore.persist.rehydrate();
    expect(useAuthStore.getState()).toMatchObject({ user: { id: user.id, username: user.username }, isAuthenticated: true });
    expect(typeof useAuthStore.getState().logout).toBe("function");
  });

  test("atualiza o perfil sem perder os outros dados ou a autenticação", () => {
    useAuthStore.getState().setUser({ user, isAuthenticated: true });
    useAuthStore.getState().updateUser({ firstName: "Ana" });
    expect(useAuthStore.getState()).toMatchObject({ user: { ...user, firstName: "Ana" }, isAuthenticated: true });
  });

  test("uma atualização sem sessão não inventa usuário", () => {
    useAuthStore.getState().updateUser({ firstName: "Ana" });
    expect(useAuthStore.getState()).toMatchObject({ user: null, isAuthenticated: false });
  });

  test("logout limpa também a sessão persistida", () => {
    useAuthStore.getState().setUser({ user, isAuthenticated: true });
    useAuthStore.getState().logout();
    expect(useAuthStore.getState()).toMatchObject({ user: null, isAuthenticated: false });
    const saved = storageValues.get("auth-session");
    if (!saved) throw new Error("O logout deveria ser persistido");
    expect(JSON.parse(saved)).toMatchObject({
      state: { user: null, isAuthenticated: false },
    });
  });

  test("logout remove os dados privados do cache do React Query", () => {
    useAuthStore.getState().setUser({ user, isAuthenticated: true });
    queryClient.setQueryData(noteKeys.search(user.id, "privado"), [{ content: "Não manter na memória" }]);
    useAuthStore.getState().logout();
    expect(queryClient.getQueryCache().getAll()).toEqual([]);
  });

  test("trocar de conta também limpa as consultas da sessão anterior", () => {
    useAuthStore.getState().setUser({ user, isAuthenticated: true });
    queryClient.setQueryData(noteKeys.search(user.id, "privado"), [{ content: "Privado" }]);
    useAuthStore.getState().setUser({ user: { ...user, id: user.id + 1 }, isAuthenticated: true });
    expect(queryClient.getQueryCache().getAll()).toEqual([]);
  });
});

describe("estado do cadastro por etapas", () => {
  test("mescla etapas sem perder identidade, nascimento ou senha", () => {
    useRegisterStore.getState().updateRegister({
      firstName: "Ana", secondName: "Silva", username: "ana", birthDate: new Date(2000, 1, 29),
    });
    useRegisterStore.getState().updateRegister({ password: "hash-local" });
    useRegisterStore.getState().updateRegister({ gender: "female", pronoun: "she_her" });
    expect(useRegisterStore.getState().getFormValues()).toEqual({
      firstName: "Ana", secondName: "Silva", username: "ana", birthDate: "29/02/2000",
      password: "hash-local", gender: "female", pronoun: "she_her",
    });
  });

  test("reset remove dados do cadastro anterior e retorna nascimento vazio ao formulário", () => {
    useRegisterStore.getState().updateRegister({ password: "segredo", birthDate: new Date(2000, 0, 1) });
    useRegisterStore.getState().reset();
    expect(useRegisterStore.getState().register).toEqual({});
    expect(useRegisterStore.getState().getFormValues()).toEqual({ birthDate: "" });
  });
});
