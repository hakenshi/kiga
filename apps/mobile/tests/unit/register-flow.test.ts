import { beforeEach, describe, expect, it } from "bun:test";
import {
  registerIdentitySchema,
  registerNameSchema,
  registerPinSchema,
  registerSecuritySchema,
} from "@/lib/db/zod/schemas/auth.schema";
import { useRegisterStore } from "@/stores/register-store";

describe("Fluxo de Cadastro - 4 Etapas com Zustand Store", () => {
  beforeEach(() => {
    useRegisterStore.getState().reset();
  });

  describe("Etapa 1: Identificação (registerNameSchema + Store)", () => {
    it("deve validar com sucesso nomes, username e data de nascimento válidos", () => {
      const valid = {
        firstName: "Yoru",
        secondName: "Kiga",
        username: "yoru_kiga",
        birthDate: "1998-05-20",
      };
      const res = registerNameSchema.safeParse(valid);
      expect(res.success).toBe(true);

      if (res.success) {
        useRegisterStore.getState().setStep1Data({
          firstName: res.data.firstName,
          secondName: res.data.secondName,
          username: res.data.username,
          birthDate: res.data.birthDate.toISOString(),
        });

        const state = useRegisterStore.getState();
        expect(state.firstName).toBe("Yoru");
        expect(state.secondName).toBe("Kiga");
        expect(state.username).toBe("yoru_kiga");
      }
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

  describe("Etapa 2: Segurança (registerSecuritySchema + Store)", () => {
    it("deve validar senhas coincidentes e salvar na store", () => {
      const valid = {
        password: "senhaForte123",
        confirmPassword: "senhaForte123",
      };
      const res = registerSecuritySchema.safeParse(valid);
      expect(res.success).toBe(true);

      if (res.success) {
        useRegisterStore.getState().setStep2Data(res.data);
        const state = useRegisterStore.getState();
        expect(state.password).toBe("senhaForte123");
        expect(state.confirmPassword).toBe("senhaForte123");
      }
    });

    it("deve rejeitar senhas que não coincidem", () => {
      const invalid = {
        password: "senhaForte123",
        confirmPassword: "outraSenha123",
      };
      const res = registerSecuritySchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });
  });

  describe("Etapa 3: Identidade (registerIdentitySchema + Store)", () => {
    it("deve validar gêneros e pronomes válidos e salvar na store", () => {
      const valid = {
        gender: "male",
        pronoun: "he_him",
      } as const;
      const res = registerIdentitySchema.safeParse(valid);
      expect(res.success).toBe(true);

      if (res.success) {
        useRegisterStore.getState().setStep3Data(res.data);
        const state = useRegisterStore.getState();
        expect(state.gender).toBe("male");
        expect(state.pronoun).toBe("he_him");
      }
    });

    it("deve rejeitar gênero/pronome não selecionados", () => {
      const invalid = {
        gender: undefined,
        pronoun: undefined,
      };
      const res = registerIdentitySchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });
  });

  describe("Etapa 4: PIN e Consolidação Final do Cadastro", () => {
    it("deve validar PIN de 4 dígitos", () => {
      const valid = { pin: "1234" };
      const res = registerPinSchema.safeParse(valid);
      expect(res.success).toBe(true);

      const invalid = { pin: "12a" };
      const resInvalid = registerPinSchema.safeParse(invalid);
      expect(resInvalid.success).toBe(false);
    });

    it("deve consolidar todos os dados das etapas no estado final e resetar após conclusão", () => {
      // Simula preenchimento das etapas anteriores
      useRegisterStore.getState().setStep1Data({
        firstName: "Yoru",
        secondName: "Kiga",
        username: "yoru_kiga",
        birthDate: new Date("1998-05-20").toISOString(),
      });

      useRegisterStore.getState().setStep2Data({
        password: "senhaSegura123",
        confirmPassword: "senhaSegura123",
      });

      useRegisterStore.getState().setStep3Data({
        gender: "male",
        pronoun: "he_him",
      });

      useRegisterStore.getState().setPin("5678");

      // Lê estado consolidado na etapa 4 para inserção no banco
      const finalState = useRegisterStore.getState();
      expect(finalState.firstName).toBe("Yoru");
      expect(finalState.secondName).toBe("Kiga");
      expect(finalState.username).toBe("yoru_kiga");
      expect(finalState.password).toBe("senhaSegura123");
      expect(finalState.gender).toBe("male");
      expect(finalState.pronoun).toBe("he_him");
      expect(finalState.pin).toBe("5678");

      // Limpeza após o cadastro ser persistido no SQLite
      useRegisterStore.getState().reset();

      const clearedState = useRegisterStore.getState();
      expect(clearedState.firstName).toBe("");
      expect(clearedState.username).toBe("");
      expect(clearedState.password).toBe("");
      expect(clearedState.pin).toBe("");
    });
  });
});
