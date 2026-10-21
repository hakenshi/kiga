import { deleteItemAsync, getItem, getItemAsync, setItem, setItemAsync } from "expo-secure-store";

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
 * Converte string de data para o formato mascarado DD/MM/AAAA.
 */
export function toMaskedDate(value: string): string {
  if (value.includes("/")) return value;
  const d = new Date(value);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Verifica se um timestamp de expiração já passou.
 */
export function isExpired(expiresAt: number): boolean {
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

export function getStoredItem<T>(key: string): T | null {
  const storedItemString = getItem(key);
  if (!storedItemString) return null;

  const parsed = JSON.parse(storedItemString);
  if (isExpired(parsed.expiresAt)) {
    deleteItemAsync(key);
    return null;
  }

  if (parsed.expiresAt && parsed.updatedAt) {
    const duration = parsed.expiresAt - parsed.updatedAt;
    const now = Date.now();
    parsed.updatedAt = now;
    parsed.expiresAt = now + duration;
    setItem(key, JSON.stringify(parsed));
  }

  return parsed.data ?? parsed;
}

export async function getStoredItemAsync<T>(key: string): Promise<T | null> {
  const storedItemString = await getItemAsync(key);
  if (!storedItemString) return null;

  const parsed = JSON.parse(storedItemString);
  if (isExpired(parsed.expiresAt)) {
    await deleteItemAsync(key);
    return null;
  }

  if (parsed.expiresAt && parsed.updatedAt) {
    const duration = parsed.expiresAt - parsed.updatedAt;
    const now = Date.now();
    parsed.updatedAt = now;
    parsed.expiresAt = now + duration;
    await setItemAsync(key, JSON.stringify(parsed));
  }

  return parsed.data ?? parsed;
}

export async function setStoredItem<T>(key: string, item: T, expiresAt?: number): Promise<void> {
  const payload = expiresAt
    ? {
      data: item,
      expiresAt,
      updatedAt: Date.now(),
    }
    : item;
  await setItemAsync(key, JSON.stringify(payload));
}

export async function removeStoredItem(key: string): Promise<void> {
  await deleteItemAsync(key);
}

export const REGISTER_STORAGE_KEYS = [
  "register-name",
  "register-security",
  "register-identity",
] as const;

export async function clearRegisterStorage(): Promise<void> {
  for (const key of REGISTER_STORAGE_KEYS) {
    await deleteItemAsync(key);
  }
}
