import { openDatabaseSync } from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import * as schema from "./schema";
import * as relations from "./relations";

export const expo = openDatabaseSync("kiga.db");
export const db = drizzle(expo, { schema: { ...schema, ...relations } });

export default db;
