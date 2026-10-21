import { beforeEach, describe, expect, it } from "bun:test";
import {
  registerIdentitySchema,
  registerNameSchema,
  registerPinSchema,
  registerSecuritySchema,
} from "@/lib/db/zod/zod-schemas";
import { createTimestamps, isExpired } from "@/lib/utils";

describe("Fluxo de Cadastro - 4 Etapas", () => {
  const mockStorage = new Map<string, string>();

  const fakeSecureStore = {
    getItem: (key: string): string | null => mockStorage.get(key) ?? null,
    setItemAsync: async (key: string, value: string): Promise<void> => {
      mockStorage.set(key, value);
    },
    deleteItemAsync: async (key: string): Promise<void> => {
      mockStorage.delete(key);
    },
  };

  beforeEach(() => {
    mockStorage.clear();
  });

  describe("Etapa 1: Identificação (registerNameSchema)", () => {
    it("deve validar com sucesso nomes, username e data de nascimento válidos", () => {
      const valid = {
        firstName: "Yoru",
        secondName: "Kiga",
        username: "yoru_kiga",
        birthDate: "1998-05-20",
      };
      const res = registerNameSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it("deve rejeitar campos vazios ou menores que o limite", () => {
      const invalid = {
        firstName: "Y",
        secondName: "K",
        username: "yo",
        birthDate: "",
      };
      const res = registerNameSchema.safeParse(invalid);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues.length).toBeGreaterThanOrEqual(3);
      }
    });
  });

  describe("Etapa 2: Segurança (registerSecuritySchema)", () => {
    it("deve validar senhas coincidentes", () => {
      const valid = {
        password: "senhaForte123",
        confirmPassword: "senhaForte123",
      };
      const res = registerSecuritySchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it("deve rejeitar senhas não coincidentes", () => {
      const invalid = {
        password: "senhaForte123",
        confirmPassword: "outraSenha123",
      };
      const res = registerSecuritySchema.safeParse(invalid);
      expect(res.success).toBe(false);
      if (!res.success) {
        const issue = res.error.issues.find(
          (i) => i.path[0] === "confirmPassword"
        );
        expect(issue).toBeDefined();
        expect(issue?.message).toBe("As senhas não coincidem");
      }
    });

    it("deve rejeitar senha curta", () => {
      const invalid = {
        password: "12",
        confirmPassword: "12",
      };
      const res = registerSecuritySchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });
  });

  describe("Etapa 3: Identidade (registerIdentitySchema)", () => {
    it("deve validar gêneros e pronomes válidos do enum em inglês", () => {
      const valid = {
        gender: "non_binary",
        pronoun: "they_them",
      };
      const res = registerIdentitySchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it("deve rejeitar valores fora do enum", () => {
      const invalid = {
        gender: "invalido",
        pronoun: "invalido",
      };
      const res = registerIdentitySchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });
  });

  describe("Etapa 4: PIN e Finalização (registerPinSchema)", () => {
    it("deve validar PIN de 4 a 6 dígitos numéricos", () => {
      expect(registerPinSchema.safeParse({ pin: "1234" }).success).toBe(true);
      expect(registerPinSchema.safeParse({ pin: "123456" }).success).toBe(true);
    });

    it("deve rejeitar PIN com letras ou caracteres especiais", () => {
      expect(registerPinSchema.safeParse({ pin: "123a" }).success).toBe(false);
      expect(registerPinSchema.safeParse({ pin: "12-4" }).success).toBe(false);
    });

    it("deve rejeitar PIN com menos de 4 ou mais de 6 dígitos", () => {
      expect(registerPinSchema.safeParse({ pin: "123" }).success).toBe(false);
      expect(registerPinSchema.safeParse({ pin: "1234567" }).success).toBe(false);
    });
  });

  describe("Integração do Fluxo Acumulado no SecureStore", () => {
    it("deve acumular as etapas 1, 2, 3 e permitir registrar com a etapa 4", async () => {
      // Step 1
      await fakeSecureStore.setItemAsync(
        "register-name",
        JSON.stringify({
          data: {
            firstName: "Yoru",
            secondName: "Kiga",
            username: "yoru_kiga",
            birthDate: "1998-05-20",
          },
        })
      );

      // Step 2
      await fakeSecureStore.setItemAsync(
        "register-security",
        JSON.stringify({
          data: {
            password: "password123",
            confirmPassword: "password123",
          },
        })
      );

      // Step 3
      await fakeSecureStore.setItemAsync(
        "register-identity",
        JSON.stringify({
          data: { gender: "male", pronoun: "he_him" },
        })
      );

      // Leitura na Etapa 4
      const nameRaw = fakeSecureStore.getItem("register-name");
      const securityRaw = fakeSecureStore.getItem("register-security");
      const identityRaw = fakeSecureStore.getItem("register-identity");

      expect(nameRaw).not.toBeNull();
      expect(securityRaw).not.toBeNull();
      expect(identityRaw).not.toBeNull();

      const nameParsed = JSON.parse(nameRaw!).data;
      const securityParsed = JSON.parse(securityRaw!).data;
      const identityParsed = JSON.parse(identityRaw!).data;

      const fullUserPayload = {
        firstName: nameParsed.firstName,
        secondName: nameParsed.secondName,
        username: nameParsed.username,
        birthDate: new Date(nameParsed.birthDate),
        password: securityParsed.password,
        gender: identityParsed.gender,
        pronoun: identityParsed.pronoun,
        pin: "5678",
      };

      expect(fullUserPayload.username).toBe("yoru_kiga");
      expect(fullUserPayload.firstName).toBe("Yoru");
      expect(fullUserPayload.gender).toBe("male");
      expect(fullUserPayload.pronoun).toBe("he_him");
      expect(fullUserPayload.pin).toBe("5678");

      // Limpeza após cadastro concluído
      await fakeSecureStore.deleteItemAsync("register-name");
      await fakeSecureStore.deleteItemAsync("register-security");
      await fakeSecureStore.deleteItemAsync("register-identity");

      expect(fakeSecureStore.getItem("register-name")).toBeNull();
      expect(fakeSecureStore.getItem("register-security")).toBeNull();
      expect(fakeSecureStore.getItem("register-identity")).toBeNull();
    });

    it("deve detectar e limpar dados cujo tempo de expiração se esgotou", async () => {
      const pastTime = Date.now() - 5000;
      await fakeSecureStore.setItemAsync(
        "register-name",
        JSON.stringify({
          data: {
            firstName: "Expirado",
            secondName: "User",
            username: "expirado",
          },
          updatedAt: pastTime - 3600000,
          expiresAt: pastTime,
        })
      );

      const raw = fakeSecureStore.getItem("register-name");
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(isExpired(parsed.expiresAt)).toBe(true);

      // Simulação do useEffect de limpeza
      if (isExpired(parsed.expiresAt)) {
        await fakeSecureStore.deleteItemAsync("register-name");
      }

      expect(fakeSecureStore.getItem("register-name")).toBeNull();
    });

    it("deve manter dados válidos dentro do tempo de expiração", async () => {
      const timestamps = createTimestamps(3600000);
      expect(isExpired(timestamps.expiresAt)).toBe(false);
      expect(timestamps.expiresAt).toBeGreaterThan(Date.now());
    });
  });
});
