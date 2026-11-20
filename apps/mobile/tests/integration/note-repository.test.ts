import { beforeEach, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { z } from "zod";
import {
  behaviors, emotions, moods, noteBehaviors, noteEmotions, noteImages,
  noteReactions, noteReplies, noteReposts, notes, noteThoughts, reactions, thoughts,
} from "../../src/lib/db/schema";
import { NotFoundException } from "../../src/lib/exceptions/not-found/index.exception";
import { NoteRepository } from "../../src/repositories/note-repository";
import { resetDatabase, sqlite, testDb } from "../helpers/database";
import { seedUsers } from "../helpers/seed";

let ownerId: number;
let otherId: number;
let relations: Required<Pick<NoteInsert, "moodId" | "noteBehaviors" | "noteEmotions" | "noteImages" | "noteReactions" | "noteThoughts">>;

beforeEach(() => {
  resetDatabase();
  const { owner, other } = seedUsers();
  ownerId = owner.id;
  otherId = other.id;
  const mood = testDb.insert(moods).values({
    name: "Bem", label: "Bem", icon: "smile", color: "#000", border: "#fff",
  }).returning().get();
  const behavior = testDb.insert(behaviors).values({ content: "Caminhar", icon: "walk" }).returning().get();
  const emotion = testDb.insert(emotions).values({ name: "Alegria" }).returning().get();
  const reaction = testDb.insert(reactions).values({ name: "Sorrir" }).returning().get();
  const thought = testDb.insert(thoughts).values({ name: "Consegui" }).returning().get();
  relations = {
    moodId: mood.id,
    noteBehaviors: [behavior.id],
    noteEmotions: [emotion.id],
    noteImages: ["file:///primeira.jpg", "file:///segunda.jpg"],
    noteReactions: [reaction.id],
    noteThoughts: [thought.id],
  };
});

function createNote(data: Partial<NoteInsert> = {}) {
  return NoteRepository.create({ userId: ownerId, content: "Registro local", noteType: "note", ...data });
}

describe("NoteRepository com SQLite", () => {
  test("as migrações criam o schema atual com chaves estrangeiras ativas", () => {
    expect(sqlite.query("PRAGMA foreign_keys").get()).toEqual({ foreign_keys: 1 });
    expect(sqlite.query("PRAGMA foreign_key_check").all()).toEqual([]);
    expect(sqlite.query("SELECT name FROM sqlite_master WHERE name = 'journal_entries'").all()).toEqual([]);
  });

  test("cria e relê uma nota completa com todas as relações", async () => {
    const date = new Date(2026, 0, 10, 12);
    const created = createNote({ ...relations, date });
    expect(created).toMatchObject({
      userId: ownerId,
      content: "Registro local",
      noteType: "note",
      date,
      liked: false,
      fixed: false,
      isRepost: false,
      isPureRepost: false,
      mood: { id: relations.moodId, name: "Bem" },
      noteBehaviors: [{ behavior: { content: "Caminhar" } }],
      noteEmotions: [{ emotion: { name: "Alegria" } }],
      noteReactions: [{ reaction: { name: "Sorrir" } }],
      noteThoughts: [{ thought: { name: "Consegui" } }],
    });
    expect(created.noteImages.map(image => image.imageUrl)).toEqual(relations.noteImages);
    expect(await NoteRepository.findOne(created.id)).toEqual(created);
  });

  test("uma nota sem tags retorna coleções vazias e humor nulo", () => {
    expect(createNote()).toMatchObject({
      noteBehaviors: [], noteEmotions: [], noteImages: [], noteReactions: [], noteThoughts: [],
      mood: null, thread: [], reposts: [],
    });
  });

  test("a listagem exclui notas de outra conta, apagadas, respostas e reposts", async () => {
    const visible = createNote();
    createNote({ userId: otherId });
    const deleted = createNote();
    testDb.update(notes).set({ deletedAt: new Date() }).where(eq(notes.id, deleted.id)).run();
    NoteRepository.createReply(visible.id, { userId: ownerId, content: "Resposta" });
    createNote({ noteType: "repost" });

    expect((await NoteRepository.findMany(ownerId, { limit: 20, offset: 0 })).map(note => note.id))
      .toEqual([visible.id]);
    expect(await NoteRepository.findOne(deleted.id)).toBeUndefined();
    expect(await NoteRepository.findOne(9999)).toBeUndefined();
  });

  test("ordena fixadas primeiro e pagina sem repetir nem pular registros", async () => {
    const first = createNote();
    const fixed = createNote({ fixed: true });
    const latest = createNote();

    expect((await NoteRepository.findMany(ownerId, { limit: 2, offset: 0 })).map(note => note.id))
      .toEqual([fixed.id, latest.id]);
    expect((await NoteRepository.findMany(ownerId, { limit: 2, offset: 2 })).map(note => note.id))
      .toEqual([first.id]);
    expect(await NoteRepository.findMany(ownerId, { limit: 2, offset: 4 })).toEqual([]);
  });

  test("busca por conteúdo sem expor notas de outra conta ou apagadas", () => {
    const match = createNote({ content: "Hoje fui caminhar" });
    createNote({ content: "Outra atividade" });
    createNote({ userId: otherId, content: "caminhar em privado" });
    const deleted = createNote({ content: "caminhar apagado" });
    testDb.update(notes).set({ deletedAt: new Date() }).where(eq(notes.id, deleted.id)).run();

    expect(NoteRepository.search("  CAMINHAR  ", { userId: ownerId }).map(note => note.id)).toEqual([match.id]);
    expect(NoteRepository.search("inexistente", { userId: ownerId })).toEqual([]);
  });

  test("atualiza conteúdo e flags sem perder as relações omitidas", () => {
    const created = createNote(relations);
    const updated = NoteRepository.update(created.id, { content: "Editado", liked: true, fixed: true });
    expect(updated).toMatchObject({ content: "Editado", liked: true, fixed: true });
    expect(updated.updatedAt).toBeInstanceOf(Date);
    expect(updated.noteImages).toEqual(created.noteImages);
    expect(updated.noteEmotions).toEqual(created.noteEmotions);
    expect(updated.noteBehaviors).toEqual(created.noteBehaviors);
    expect(updated.noteReactions).toEqual(created.noteReactions);
    expect(updated.noteThoughts).toEqual(created.noteThoughts);
  });

  test("substitui as relações informadas e permite limpar todas as seleções", () => {
    const created = createNote(relations);
    const updated = NoteRepository.update(created.id, {
      moodId: null, noteBehaviors: [], noteEmotions: [], noteReactions: [], noteThoughts: [],
      noteImages: ["file:///nova.jpg"],
    });
    expect(updated).toMatchObject({
      moodId: null, mood: null, noteBehaviors: [], noteEmotions: [], noteReactions: [], noteThoughts: [],
    });
    expect(updated.noteImages.map(image => image.imageUrl)).toEqual(["file:///nova.jpg"]);
    expect(NoteRepository.update(created.id, { noteImages: [] }).noteImages).toEqual([]);
  });

  test.each([
    ["noteBehaviors", { noteBehaviors: [9999] }],
    ["noteEmotions", { noteEmotions: [9999] }],
    ["noteReactions", { noteReactions: [9999] }],
    ["noteThoughts", { noteThoughts: [9999] }],
  ] satisfies [string, Partial<NoteInsert>][])("uma relação inválida em %s reverte a criação inteira", (_, data) => {
    expect(() => createNote({ ...relations, ...data })).toThrow();
    expect(testDb.select().from(notes).all()).toEqual([]);
    expect(testDb.select().from(noteImages).all()).toEqual([]);
    expect(testDb.select().from(noteBehaviors).all()).toEqual([]);
    expect(testDb.select().from(noteEmotions).all()).toEqual([]);
    expect(testDb.select().from(noteReactions).all()).toEqual([]);
    expect(testDb.select().from(noteThoughts).all()).toEqual([]);
  });

  test("uma tag duplicada reverte a transação em vez de deixar uma nota incompleta", () => {
    const [emotionId] = relations.noteEmotions;
    expect(() => createNote({ ...relations, noteEmotions: [emotionId, emotionId] })).toThrow();
    expect(testDb.select().from(notes).all()).toEqual([]);
  });

  test("uma atualização inválida restaura conteúdo e relações anteriores", async () => {
    const created = createNote(relations);
    expect(() => NoteRepository.update(created.id, {
      content: "Não deve persistir",
      noteImages: ["file:///nao-salvar.jpg"],
      noteEmotions: [9999],
    })).toThrow();
    expect(await NoteRepository.findOne(created.id)).toEqual(created);
  });

  test("propaga validação e distingue atualização de nota inexistente", () => {
    expect(() => createNote({ userId: "inválido" as unknown as number })).toThrow(z.ZodError);
    expect(() => NoteRepository.update(9999, { content: "Editado" })).toThrow(NotFoundException);
    expect(testDb.select().from(notes).all()).toEqual([]);
  });

  test("cria o vínculo correspondente ao repost", () => {
    const created = createNote({ noteType: "repost", content: "" });
    expect(created.noteType).toBe("repost");
    expect(created.isRepost).toBe(true);
    expect(created.isPureRepost).toBe(true);
    expect(created.reposts)
      .toMatchObject([{ noteId: created.id }]);
  });

  test("repost com comentário não é classificado como repost puro", () => {
    expect(createNote({ noteType: "repost", content: "Minha reflexão" })).toMatchObject({
      isRepost: true, isPureRepost: false,
    });
  });

  test("exclusão definitiva remove todos os vínculos e preserva o catálogo de tags", async () => {
    const created = createNote({ ...relations, noteType: "repost" });
    expect(await NoteRepository.delete(created.id)).toHaveLength(1);
    expect(await NoteRepository.findOne(created.id)).toBeUndefined();
    for (const table of [noteBehaviors, noteEmotions, noteImages, noteReactions, noteThoughts, noteReplies, noteReposts]) {
      expect(testDb.select().from(table).all()).toEqual([]);
    }
    expect(testDb.select().from(emotions).all()).toHaveLength(1);
    expect(await NoteRepository.delete(created.id)).toEqual([]);
  });
});
