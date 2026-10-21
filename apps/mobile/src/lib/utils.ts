/**
 * Aplica máscara de data no formato DD/MM/AAAA conforme o usuário digita.
 */
export function formatDateMask(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/**
 * Converte Date, string ISO ou texto de data para o formato mascarado DD/MM/AAAA.
 */
export function toMaskedDate(value?: string | Date | null): string {
  if (!value) return "";
  if (value instanceof Date) {
    const day = String(value.getUTCDate()).padStart(2, "0");
    const month = String(value.getUTCMonth() + 1).padStart(2, "0");
    const year = value.getUTCFullYear();
    return `${day}/${month}/${year}`;
  }
  if (typeof value === "string") {
    if (value.includes("/")) return value;
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    const day = String(d.getUTCDate()).padStart(2, "0");
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
  }
  return "";
}

/**
 * Verifica se um timestamp de expiração já passou.
 */
export function isExpired(expiresAt?: number): boolean {
  if (typeof expiresAt !== "number") return false;
  return Date.now() > expiresAt;
}

/**
 * Cria os timestamps de criação e expiração para armazenamento em cache/secure store.
 */
export function createTimestamps(durationMs: number = 60 * 60 * 1000): {
  updatedAt: number;
  expiresAt: number;
} {
  const now = Date.now();
  return {
    updatedAt: now,
    expiresAt: now + durationMs,
  };
}
