import { afterEach, describe, expect, setSystemTime, test } from "bun:test";
import { countWords, formatDateMask, formatNoteDate, toggleSelectedId, toMaskedDate } from "../../src/lib/utils";
import { MOOD_BY_ID, resolveMoodConfig } from "../../src/lib/mood-utils";

afterEach(() => setSystemTime());

describe("máscara de nascimento", () => {
  test.each([
    ["", ""],
    ["1", "1"],
    ["12", "12"],
    ["123", "12/3"],
    ["1234", "12/34"],
    ["12345", "12/34/5"],
    ["20051998", "20/05/1998"],
    ["20/05/1998", "20/05/1998"],
    ["abc20x05y1998zz99", "20/05/1998"],
  ])("%s → %s", (input, expected) => {
    expect(formatDateMask(input)).toBe(expected);
  });

  test("converte a data ISO usando o dia UTC, sem deslocamento de fuso", () => {
    expect(toMaskedDate("1998-05-20T00:00:00.000Z")).toBe("20/05/1998");
    expect(toMaskedDate("20/05/1998")).toBe("20/05/1998");
    expect(toMaskedDate("2000-02-29")).toBe("29/02/2000");
  });
});

describe("conteúdo do diário", () => {
  test.each([
    ["", 0],
    [" \t\n ", 0],
    ["diário", 1],
    ["  Hoje  eu\nme\tsenti bem.  ", 5],
    ["olá, mundo!", 2],
  ])("conta palavras em %j", (content, count) => {
    expect(countWords(content)).toBe(count);
  });

  test("seleção adiciona e remove o ID exato sem alterar o array original", () => {
    const original = [1, 12];
    expect(toggleSelectedId(original, 2)).toEqual([1, 12, 2]);
    expect(toggleSelectedId(original, 1)).toEqual([12]);
    expect(original).toEqual([1, 12]);
    expect(toggleSelectedId([], 1)).toEqual([1]);
  });

  test("formata notas de hoje e de outros dias em português", () => {
    setSystemTime(new Date(2026, 10, 19, 18));
    expect(formatNoteDate(new Date(2026, 10, 19, 9, 5))).toBe("Hoje · 09:05");
    expect(formatNoteDate(new Date(2026, 0, 10, 12, 30))).toBe("10 de jan · 12:30");
  });

  test("datas ausentes ou inválidas não aparecem como Invalid Date", () => {
    for (const value of [undefined, null, "", "inválida", new Date(NaN)]) {
      expect(formatNoteDate(value)).toBe("");
    }
  });
});

describe("apresentação do humor", () => {
  test.each([1, 2, 3, 4, 5])("resolve o humor padrão %i", (moodId) => {
    expect(resolveMoodConfig({ moodId })).toEqual(MOOD_BY_ID[moodId]);
  });

  test("usa o ID da relação quando não há moodId e preserva o nome personalizado", () => {
    expect(resolveMoodConfig({ mood: { id: 4, name: "  Tranquilo  " } }))
      .toEqual({ ...MOOD_BY_ID[4], label: "Tranquilo" });
    expect(MOOD_BY_ID[4].label).toBe("Bem");
  });

  test.each([
    ["MUITO MAL", 1],
    ["Mal", 2],
    ["Muito bem", 5],
    ["Bem", 4],
    ["Sereno", 3],
  ])("resolve o humor personalizado %s", (name, id) => {
    expect(resolveMoodConfig({ moodId: 100, mood: { name } })).toEqual({ ...MOOD_BY_ID[id], label: name });
  });

  test("não inventa humor para uma nota sem seleção", () => {
    expect(resolveMoodConfig()).toBeNull();
    expect(resolveMoodConfig({ moodId: null, mood: null })).toBeNull();
    expect(resolveMoodConfig({ moodId: 999 })).toBeNull();
  });
});
