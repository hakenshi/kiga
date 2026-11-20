import { mock } from "bun:test";
import { sqlite, testDb } from "./helpers/database";
import { testStorage } from "./helpers/storage";

// Somente as fronteiras nativas são substituídas, nunca os repositories.
mock.module("@/lib/db", () => ({ default: testDb, db: testDb, expo: sqlite }));
mock.module("@/lib/storage", () => ({ appStorage: testStorage }));
mock.module("expo-sqlite/kv-store", () => ({ default: testStorage }));
mock.module("lucide-react-native", () => ({
  Angry: () => null,
  Frown: () => null,
  Laugh: () => null,
  Meh: () => null,
  Smile: () => null,
}));
