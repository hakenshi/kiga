import { afterEach, describe, expect, expectTypeOf, mock, test } from "bun:test";
import { z } from "zod/v4";
import { ValidationException } from "../../src/lib/exceptions/validation/index.exception";
import { validate } from "../../src/lib/validate";
import { useToastStore } from "../../src/stores/toast-store";

afterEach(() => {
  useToastStore.getState().dismiss();
});

describe("validate", () => {
  test("executa a callback com o valor validado e retorna seu resultado", async () => {
    const callback = mock((value: number) => value + 1);

    expect(await validate<{ input: number; output: number }, number>(z.number(), 0, callback)).toBe(1);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(0);
    expect(useToastStore.getState().currentToast).toBeNull();
  });

  test("entrega a saída transformada e tipada à callback", async () => {
    const schema = z.string().trim().transform((value) => value.length);
    const result = await validate<{ input: string; output: number }, number>(schema, " kiga ", (value) => {
      expectTypeOf(value).toEqualTypeOf<number>();
      return value;
    });

    expectTypeOf(result).toEqualTypeOf<number>();
    expect(result).toBe(4);
  });

  test("retorna o resultado de uma callback assíncrona", async () => {
    const result = await validate<{ input: string; output: string }, string>(
      z.string(),
      "kiga",
      (value) => Promise.resolve(value.toUpperCase()),
    );

    expectTypeOf(result).toEqualTypeOf<string>();
    expect(result).toBe("KIGA");
  });

  test("exibe o primeiro erro e não executa a callback quando a validação falha", async () => {
    const schema = z.object({
      name: z.string().min(1, "Informe o nome"),
      age: z.number().min(18, "Idade inválida"),
    });

    const callback = mock(() => "ok");

    await expect(validate(schema, { name: "", age: 0 }, callback)).rejects.toThrow(ValidationException);
    expect(callback).not.toHaveBeenCalled();
    expect(useToastStore.getState().currentToast).toMatchObject({
      type: "error",
      message: "Informe o nome",
    });
  });

  test("exibe e relança erros inesperados durante a validação", async () => {
    const error = new Error("Falha ao transformar o valor");
    const schema = z.string().transform(() => {
      throw error;
    });

    await expect(validate(schema, "kiga", (value) => value)).rejects.toThrow(error);
    expect(useToastStore.getState().currentToast).toMatchObject({
      type: "error",
      message: error.message,
    });
  });

  test("exibe e relança erros síncronos da callback", async () => {
    const error = new Error("Falha ao executar a operação");

    await expect(validate(z.string(), "kiga", () => {
      throw error;
    })).rejects.toThrow(error);
    expect(useToastStore.getState().currentToast).toMatchObject({
      type: "error",
      message: error.message,
    });
  });

  test("exibe e relança rejeições da callback assíncrona", async () => {
    const error = new Error("Falha na operação assíncrona");

    await expect(validate(z.string(), "kiga", () => Promise.reject(error))).rejects.toThrow(error);
    expect(useToastStore.getState().currentToast).toMatchObject({
      type: "error",
      message: error.message,
    });
  });
});
