import { beforeEach, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { notes, profileImages, users } from "../../src/lib/db/schema";
import { NotFoundException } from "../../src/lib/exceptions/not-found/index.exception";
import { AuthRepository } from "../../src/repositories/auth-repository";
import { resetDatabase, testDb } from "../helpers/database";
import { userInsert } from "../helpers/fixtures";

beforeEach(resetDatabase);

describe("AuthRepository com SQLite", () => {
  test("registra e consulta a conta local por nome e ID com suas relações", async () => {
    const created = AuthRepository.register(userInsert);
    expect(created).toMatchObject(userInsert);
    expect(created.id).toBeGreaterThan(0);
    expect(created.createdAt).toBeInstanceOf(Date);
    testDb.insert(profileImages).values({ userId: created.id, url: "file:///perfil.jpg" }).run();

    expect(await AuthRepository.findByUsername(userInsert.username)).toMatchObject({
      id: created.id,
      profileImages: [{ url: "file:///perfil.jpg" }],
      emotions: [],
      moods: [],
      reactions: [],
      thoughts: [],
    });
    expect(await AuthRepository.findById(created.id)).toMatchObject({ username: userInsert.username });
    expect(await AuthRepository.findById(999)).toBeUndefined();
    expect(await AuthRepository.findByUsername("inexistente")).toBeUndefined();
  });

  test("propaga o conflito de username e não grava uma segunda conta", () => {
    AuthRepository.register(userInsert);
    expect(() => AuthRepository.register(userInsert)).toThrow();
    expect(testDb.select().from(users).all()).toHaveLength(1);
  });

  test("valida antes de inserir e propaga o ZodError", () => {
    expect(() => AuthRepository.register({ ...userInsert, pin: "abc" })).toThrow(z.ZodError);
    expect(testDb.select().from(users).all()).toEqual([]);
  });

  test("atualiza somente os campos informados e normaliza o nome", async () => {
    const created = AuthRepository.register(userInsert);
    const updated = AuthRepository.updateProfile(created.id, { firstName: "  Ana  " });
    expect(updated).toMatchObject({ ...userInsert, firstName: "Ana" });
    expect(await AuthRepository.findById(created.id)).toMatchObject({ firstName: "Ana" });
  });

  test("não atualiza perfil inexistente nem persiste dados inválidos", () => {
    const created = AuthRepository.register(userInsert);
    expect(() => AuthRepository.updateProfile(999, { firstName: "Ana" })).toThrow(NotFoundException);
    expect(() => AuthRepository.updateProfile(created.id, { firstName: "" })).toThrow(z.ZodError);
    expect(testDb.select().from(users).where(eq(users.id, created.id)).get()?.firstName).toBe(userInsert.firstName);
  });

  test("excluir uma conta remove suas notas e fotos sem excluir a outra conta", async () => {
    const owner = AuthRepository.register(userInsert);
    const other = AuthRepository.register({ ...userInsert, username: "outra_conta" });
    testDb.insert(profileImages).values({ userId: owner.id, url: "file:///perfil.jpg" }).run();
    testDb.insert(notes).values({ userId: owner.id, noteType: "note", content: "privado" }).run();
    testDb.insert(notes).values({ userId: other.id, noteType: "note", content: "preservar" }).run();

    expect(await AuthRepository.deleteAccount(owner.id)).toHaveLength(1);
    expect(await AuthRepository.findById(owner.id)).toBeUndefined();
    expect(testDb.select().from(profileImages).all()).toEqual([]);
    expect(testDb.select().from(notes).all()).toMatchObject([{ userId: other.id, content: "preservar" }]);
    expect(await AuthRepository.findById(other.id)).toBeDefined();
  });
});
