import { describe, expect, test } from "bun:test";
import { formatEntryDate, formatDateMask, toMaskedDate } from "../../src/lib/utils";

describe("date formatting", () => {
  test("formats today's date and time", () => {
    const today = new Date();
    today.setHours(14, 5, 0, 0);
    expect(formatEntryDate(today)).toBe("Hoje · 14:05");
  });

  test("formats another day in Portuguese", () => {
    expect(formatEntryDate(new Date(2000, 0, 2, 14, 5))).toBe("02 de jan · 14:05");
  });

  test("ignores missing or invalid dates", () => {
    expect(formatEntryDate()).toBe("");
    expect(formatEntryDate("invalid")).toBe("");
  });

  test("preserves the birth date mask and UTC date", () => {
    expect(formatDateMask("02012000")).toBe("02/01/2000");
    expect(toMaskedDate("2000-01-02T00:00:00.000Z")).toBe("02/01/2000");
  });
});
