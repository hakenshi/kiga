import { users } from "../../src/lib/db/schema";
import { testDb } from "./database";
import { userInsert } from "./fixtures";

export function seedUsers() {
  const owner = testDb.insert(users).values(userInsert).returning().get();
  const other = testDb.insert(users).values({ ...userInsert, username: "outra_conta" }).returning().get();
  return { owner, other };
}
