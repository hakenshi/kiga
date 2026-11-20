import { afterEach, describe, expect, setSystemTime, test } from "bun:test";
import {
  loginSchema,
  registerSchema,
  userInsertSchema,
  userSelectBaseSchema,
  userUpdateSchema,
} from "../../src/lib/db/zod/schemas/auth.schema";
import { user, userInsert } from "../helpers/fixtures";

afterEach(() => setSystemTime());

describe("login local", () => {
  test("normaliza o usuário, mas não altera a senha digitada", () => {
    expect(loginSchema.parse({ username: "  diario  ", password: " senha " }))
      .toEqual({ username: "diario", password: " senha " });
  });

  test.each([
    ["username", "", "Informe o nome de usuário"],
    ["username", "ab", "O nome de usuário deve ter no mínimo 3 caracteres"],
    ["password", "", "Informe a senha"],
    ["password", "12", "A senha deve ter no mínimo 3 caracteres"],
  ])("valida %s = %j", (field, value, message) => {
    const result = loginSchema.safeParse({ username: "diario", password: "senha", [field]: value });
    expect(result.success).toBe(false);
    if (result.success) throw new Error("A validação deveria falhar");
    expect(result.error.issues[0].message).toBe(message);
  });
});

describe("cadastro por etapas", () => {
  test("aceita uma etapa parcial e transforma a data em Date", () => {
    const result = registerSchema.parse({ firstName: "  Ana  ", birthDate: "29/02/2000" });
    expect(result).toEqual({ firstName: "Ana", birthDate: new Date(2000, 1, 29) });
    expect(registerSchema.parse({ pin: "1234" })).toEqual({ pin: "1234" });
  });

  test.each([
    ["", "Informe uma data de nascimento"],
    ["31/02/2000", "Data inválida, use DD/MM/YYYY"],
    ["29/02/2001", "Data inválida, use DD/MM/YYYY"],
    ["1/01/2000", "Data inválida, use DD/MM/YYYY"],
    ["2000-01-01", "Data inválida, use DD/MM/YYYY"],
    ["31/12/1919", "Ano de nascimento inválido"],
    ["20/11/2026", "Você não é um viajante do tempo."],
  ])("rejeita nascimento %j", (birthDate, message) => {
    setSystemTime(new Date(2026, 10, 19, 12));
    const result = registerSchema.safeParse({ birthDate });
    expect(result.success).toBe(false);
    if (result.success) throw new Error("A validação deveria falhar");
    expect(result.error.issues[0].message).toBe(message);
  });

  test("aceita o limite inferior do ano e a data de hoje", () => {
    setSystemTime(new Date(2026, 10, 19, 12));
    expect(registerSchema.safeParse({ birthDate: "01/01/1920" }).success).toBe(true);
    expect(registerSchema.safeParse({ birthDate: "19/11/2026" }).success).toBe(true);
  });

  test("associa a divergência de senhas ao campo de confirmação", () => {
    const result = registerSchema.safeParse({ password: "senha1", confirmPassword: "senha2" });
    expect(result.success).toBe(false);
    if (result.success) throw new Error("A validação deveria falhar");
    expect(result.error.issues[0]).toMatchObject({
      path: ["confirmPassword"],
      message: "As senhas não coincidem",
    });
    expect(registerSchema.safeParse({ password: "senha1", confirmPassword: "senha1" }).success).toBe(true);
  });

  test.each([
    ["", "Informe o PIN de segurança"],
    ["abcd", "O PIN deve conter apenas números"],
    ["123", "O PIN deve ter no mínimo 4 dígitos"],
    ["1234567", "O PIN deve ter no máximo 6 dígitos"],
  ])("rejeita PIN %j", (pin, message) => {
    const result = registerSchema.safeParse({ pin });
    expect(result.success).toBe(false);
    if (result.success) throw new Error("A validação deveria falhar");
    expect(result.error.issues[0].message).toBe(message);
  });

  test.each(["0123", "12345", "123456"])("aceita PIN %s sem perder zeros", (pin) => {
    expect(registerSchema.parse({ pin }).pin).toBe(pin);
  });

  test("rejeita gênero e pronome fora das opções", () => {
    expect(registerSchema.safeParse({ gender: "inválido" }).success).toBe(false);
    expect(registerSchema.safeParse({ pronoun: "inválido" }).success).toBe(false);
  });
});

describe("dados do usuário", () => {
  test("normaliza os campos de cadastro sem persistir confirmação de senha", () => {
    expect(userInsertSchema.parse({
      ...userInsert,
      firstName: " Ana ",
      secondName: " Silva ",
      username: " ana ",
      password: " senha ",
      confirmPassword: "senha",
    })).toEqual({ ...userInsert, firstName: "Ana", secondName: "Silva", username: "ana", password: "senha" });
  });

  test("a seleção para sessão exclui senha e PIN", () => {
    const result = userSelectBaseSchema.parse({ ...user, password: "segredo", pin: "1234" });
    expect(result).toEqual(user);
    expect(result).not.toHaveProperty("password");
    expect(result).not.toHaveProperty("pin");
  });

  test("atualização parcial não exige os outros campos", () => {
    expect(userUpdateSchema.parse({ firstName: "  Ana  " })).toEqual({ firstName: "Ana" });
    expect(userUpdateSchema.safeParse({ username: "ab" }).success).toBe(false);
  });
});
