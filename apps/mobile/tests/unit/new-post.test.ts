import { describe, expect, it } from "bun:test";
import { newPostSchema } from "@/lib/db/zod/zod-schemas";

describe("Validação de Novo Post (newPostSchema)", () => {
  it("deve validar com sucesso um post válido com texto e humor", () => {
    const input = {
      content: "Hoje o dia foi produtivo e me sinto calmo.",
      moodId: 4,
      emotions: [{ id: 1, name: "Calma" }],
      thoughts: [{ id: 2, name: "Eu consigo dar conta" }],
      reactions: [{ id: 3, name: "Respiração lenta" }],
    };

    const res = newPostSchema.safeParse(input);
    expect(res.success).toBe(true);

    if (res.success) {
      expect(res.data.content).toBe("Hoje o dia foi produtivo e me sinto calmo.");
      expect(res.data.moodId).toBe(4);
      expect(res.data.emotions.length).toBe(1);
      expect(res.data.thoughts.length).toBe(1);
      expect(res.data.reactions.length).toBe(1);
    }
  });

  it("deve rejeitar posts com conteúdo vazio ou apenas espaços", () => {
    const emptyInput = {
      content: "   ",
      moodId: null,
      emotions: [],
      thoughts: [],
      reactions: [],
    };

    const res = newPostSchema.safeParse(emptyInput);
    expect(res.success).toBe(false);

    if (!res.success) {
      expect(res.error.issues[0].message).toBe(
        "O conteúdo do post não pode ficar em branco"
      );
    }
  });

  it("deve aplicar valores default para arrays de emoções, pensamentos e reações se não forem enviados", () => {
    const minimalInput = {
      content: "Apenas um desabafo rápido.",
    };

    const res = newPostSchema.safeParse(minimalInput);
    expect(res.success).toBe(true);

    if (res.success) {
      expect(res.data.emotions).toEqual([]);
      expect(res.data.thoughts).toEqual([]);
      expect(res.data.reactions).toEqual([]);
      expect(res.data.moodId).toBeUndefined();
    }
  });

  it("deve fazer trim no conteúdo automaticamente", () => {
    const input = {
      content: "   Texto com espaços nas pontas   ",
    };

    const res = newPostSchema.safeParse(input);
    expect(res.success).toBe(true);

    if (res.success) {
      expect(res.data.content).toBe("Texto com espaços nas pontas");
    }
  });
});
