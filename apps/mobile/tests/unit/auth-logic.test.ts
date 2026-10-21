import { describe, expect, it } from "bun:test";

describe("Lógica de Verificação de Autenticação e Senhas", () => {
  it("deve verificar uma senha válida contra seu hash gerado", () => {
    const rawPassword = "minhasenhasecreta";
    const passwordHashInDb = Bun.password.hashSync(rawPassword);

    // Como deve ser: senha em texto puro vs hash armazenado no banco
    const isValid = Bun.password.verifySync(rawPassword, passwordHashInDb);

    expect(isValid).toBe(true);
  });

  it("deve rejeitar uma senha incorreta contra o hash", () => {
    const rawPassword = "minhasenhasecreta";
    const passwordHashInDb = Bun.password.hashSync(rawPassword);

    const isWrongPasswordValid = Bun.password.verifySync("outrasenha", passwordHashInDb);

    expect(isWrongPasswordValid).toBe(false);
  });

  it("alerta: re-hashear a senha na verificação sempre falha devido ao salt dinâmico", () => {
    const rawPassword = "minhasenhasecreta";
    const passwordHashInDb = Bun.password.hashSync(rawPassword);

    // Se fizer hashSync novamente na verificação (com salt aleatório diferente):
    const rehashed = Bun.password.hashSync(rawPassword);
    const brokenVerification = Bun.password.verifySync(passwordHashInDb, rehashed);

    // Este teste documenta por que o login atual falha mesmo com a senha certa
    expect(brokenVerification).toBe(false);
  });
});
