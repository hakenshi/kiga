export const storageValues = new Map<string, string>();

export const testStorage = {
  getItem: (key: string) => storageValues.get(key) ?? null,
  setItem: (key: string, value: string) => { storageValues.set(key, value); },
  removeItem: (key: string) => { storageValues.delete(key); },
};
