import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { InfiniteQueryObserver, MutationObserver, QueryObserver, type QueryClient } from "@tanstack/react-query";
import {
  behaviors, emotions, moods, noteBehaviors, noteEmotions, noteImages,
  noteReactions, noteReplies, notes, noteThoughts, reactions, thoughts,
} from "../../src/lib/db/schema";
import { ValidationException } from "../../src/lib/exceptions/validation/index.exception";
import { NoteRepository } from "../../src/repositories/note-repository";
import { useAuthStore } from "../../src/stores/auth-store";
import { createQueryClient } from "../../src/lib/query-client";
import { noteMutations, noteQueries } from "../../src/queries/notes/queries";
import { useReplyNoteCacheStore } from "../../src/stores/reply-note-cache-store";
import { useToastStore } from "../../src/stores/toast-store";
import { resetDatabase, sqlite, testDb } from "../helpers/database";
import { seedUsers } from "../helpers/seed";

let ownerId: number;
let otherId: number;
let client: QueryClient;
const subscriptions: (() => void)[] = [];

beforeEach(() => {
  resetDatabase();
  const { owner, other } = seedUsers();
  ownerId = owner.id;
  otherId = other.id;
  useAuthStore.getState().setUser({ user: owner, isAuthenticated: true });
  client = createQueryClient();
  useReplyNoteCacheStore.getState().clear();
});

afterEach(() => {
  useToastStore.getState().dismiss();
  subscriptions.splice(0).forEach(unsubscribe => unsubscribe());
  client.clear();
  useReplyNoteCacheStore.getState().clear();
  useAuthStore.getState().logout();
});

function createRoot(content = "Nota original", userId = ownerId) {
  return NoteRepository.create({ userId, noteType: "note", content });
}

function saveReply(noteId: string) {
  return new MutationObserver(client, noteMutations.replyDraft(client, ownerId, noteId)).mutate();
}

async function observeNote(noteId: number) {
  const observer = new QueryObserver(client, noteQueries.detail(ownerId, noteId));
  subscriptions.push(observer.subscribe(() => {}));
  await observer.refetch();
  return observer;
}

async function observeFeed() {
  const observer = new InfiniteQueryObserver(client, noteQueries.feed(ownerId));
  subscriptions.push(observer.subscribe(() => {}));
  await observer.refetch();
  return observer;
}

describe("vínculos e estado da thread", () => {
  test("a resposta pertence à nota respondida, nunca a si própria ou a outra thread", async () => {
    const root = createRoot();
    const unrelated = createRoot("Outra thread");
    const data: NoteInsert = {
      userId: ownerId, content: "Minha resposta",
      noteImages: ["file:///resposta.jpg"],
    };
    const { reply } = NoteRepository.createReply(root.id, data);

    expect((await NoteRepository.findOne(root.id))?.thread).toMatchObject([{
      id: reply.id,
      noteId: root.id,
      reply: { id: reply.id, content: "Minha resposta", noteImages: [{ imageUrl: "file:///resposta.jpg" }] },
    }]);
    expect((await NoteRepository.findOne(unrelated.id))?.thread).toEqual([]);
    expect((await NoteRepository.findOne(reply.id))?.thread).toEqual([]);
  });

  test("salvar pelo composer atualiza a thread aberta e o feed sem adicionar uma resposta solta", async () => {
    const root = createRoot();
    const feed = await observeFeed();
    const detail = await observeNote(root.id);
    useReplyNoteCacheStore.getState().update({ content: "Continuação", noteImages: ["file:///nova.jpg"] });

    await saveReply(String(root.id));

    expect(feed.getCurrentResult().data?.map(note => note.id)).toEqual([root.id]);
    expect(detail.getCurrentResult().data?.thread).toMatchObject([{
      noteId: root.id,
      reply: { content: "Continuação", noteImages: [{ imageUrl: "file:///nova.jpg" }] },
    }]);
    expect(detail.getCurrentResult().data).toEqual(feed.getCurrentResult().data?.[0]);
    expect(useReplyNoteCacheStore.getState().note.content).toBe("");
    expect(useReplyNoteCacheStore.getState().expiresAt).toBe(0);

    // Reabrir o aplicativo deve produzir o mesmo resultado que a atualização em memória.
    await feed.refetch();
    expect(await NoteRepository.findOne(root.id)).toEqual(feed.getCurrentResult().data?.[0]);
  });

  test("busca ativa e nota aberta são atualizadas após responder", async () => {
    const root = createRoot();
    const search = new QueryObserver(client, noteQueries.search(ownerId, "original"));
    subscriptions.push(search.subscribe(() => {}));
    await search.refetch();
    const detail = await observeNote(root.id);
    useReplyNoteCacheStore.getState().update({ content: "Resposta encontrada na thread" });

    await saveReply(String(root.id));
    expect(search.getCurrentResult().data?.[0].thread).toMatchObject([{
      reply: { content: "Resposta encontrada na thread" },
    }]);
    expect(detail.getCurrentResult().data).toEqual(search.getCurrentResult().data?.[0]);
  });

  test("falha ao responder não apaga o rascunho nem altera outra thread aberta", async () => {
    const unrelated = createRoot("Preservar");
    const detail = await observeNote(unrelated.id);
    useReplyNoteCacheStore.getState().update({ content: "Não perder este texto" });

    await expect(saveReply("9999")).rejects.toThrow();
    expect(useReplyNoteCacheStore.getState().note.content).toBe("Não perder este texto");
    expect(detail.getCurrentResult().data).toEqual(unrelated);
    expect(useToastStore.getState().currentToast?.type).toBe("error");
  });

  test("não permite vincular uma resposta à nota de outra conta", async () => {
    const privateNote = createRoot("Privado", otherId);
    useReplyNoteCacheStore.getState().update({ content: "Não deve salvar" });
    await expect(saveReply(String(privateNote.id))).rejects.toThrow();
    expect((await NoteRepository.findOne(privateNote.id))?.thread).toEqual([]);
  });

  test("uma nota recebe várias mensagens em ordem, sem árvore ou parentNoteId", async () => {
    const root = createRoot();
    const first = NoteRepository.createReply(root.id, { userId: ownerId, content: "Primeira mensagem" });
    const second = NoteRepository.createReply(root.id, { userId: ownerId, content: "Segunda mensagem" });

    expect(second.note.thread.map(item => item.reply.content)).toEqual(["Primeira mensagem", "Segunda mensagem"]);
    expect(second.note.thread.map(item => item.noteId)).toEqual([root.id, root.id]);
    expect(second.note.thread.every(item => item.reply.thread.length === 0)).toBe(true);
    const columns = sqlite.query<{ name: string }, []>("PRAGMA table_info(note_replies)").all();
    expect(columns.map(column => column.name)).toEqual(["id", "noteId"]);
    expect(() => NoteRepository.createReply(first.reply.id, {
      userId: ownerId, content: "Não pode responder à resposta",
    })).toThrow(ValidationException);
    expect(testDb.select().from(noteReplies).all()).toHaveLength(2);
    expect((await NoteRepository.findMany(ownerId, { limit: 20, offset: 0 })).map(note => note.id)).toEqual([root.id]);
    expect(NoteRepository.search("mensagem", { userId: ownerId })).toEqual([]);
  });

  test("cada resposta mantém humor, emoções, pensamentos, reações, comportamentos e imagens próprios", async () => {
    const mood = testDb.insert(moods).values({
      name: "Bem", label: "Bem", icon: "smile", color: "#000", border: "#fff",
    }).returning().get();
    const emotion = testDb.insert(emotions).values({ name: "Alívio", userId: ownerId }).returning().get();
    const thought = testDb.insert(thoughts).values({ name: "Entendi melhor", userId: ownerId }).returning().get();
    const reaction = testDb.insert(reactions).values({ name: "Respirei", userId: ownerId }).returning().get();
    const behavior = testDb.insert(behaviors).values({ content: "Caminhei", icon: "walk", userId: ownerId }).returning().get();
    const root = createRoot();
    const feed = await observeFeed();
    const detail = await observeNote(root.id);
    useReplyNoteCacheStore.getState().update({
      content: "Com recursos", moodId: mood.id,
      noteEmotions: [emotion.id], noteThoughts: [thought.id], noteReactions: [reaction.id],
      noteBehaviors: [behavior.id], noteImages: ["file:///primeira.jpg", "file:///segunda.jpg"],
    });
    await saveReply(String(root.id));
    const saved = detail.getCurrentResult().data;
    if (!saved) throw new Error("A nota respondida deveria continuar aberta");
    const [first] = saved.thread;
    expect(feed.getCurrentResult().data?.[0]).toEqual(saved);
    expect(first.reply).toMatchObject({
      moodId: mood.id,
      noteEmotions: [{ emotionId: emotion.id }],
      noteThoughts: [{ thoughtsId: thought.id }],
      noteReactions: [{ reactionId: reaction.id }],
      noteBehaviors: [{ behaviorId: behavior.id }],
    });
    NoteRepository.createReply(root.id, { userId: ownerId, content: "Só texto" });

    const persisted = await NoteRepository.findOne(root.id);
    expect(persisted).toMatchObject({
      content: "Nota original", mood: null, noteImages: [], noteEmotions: [], noteThoughts: [],
      noteReactions: [], noteBehaviors: [],
      thread: [
        {
          noteId: root.id, id: first.reply.id,
          reply: {
            mood: { id: mood.id, name: "Bem" },
            noteEmotions: [{ noteId: first.reply.id, emotion: { id: emotion.id } }],
            noteThoughts: [{ noteId: first.reply.id, thought: { id: thought.id } }],
            noteReactions: [{ noteId: first.reply.id, reaction: { id: reaction.id } }],
            noteBehaviors: [{ noteId: first.reply.id, behavior: { id: behavior.id } }],
            noteImages: [{ imageUrl: "file:///primeira.jpg" }, { imageUrl: "file:///segunda.jpg" }],
          },
        },
        { reply: { content: "Só texto", mood: null, noteImages: [], noteEmotions: [], noteThoughts: [] } },
      ],
    });
    expect(persisted).toEqual(NoteRepository.search("original", { userId: ownerId })[0]);
    expect(persisted).toEqual((await NoteRepository.findMany(ownerId, { limit: 20, offset: 0 }))[0]);
  });

  test("uma relação inválida reverte a resposta inteira e preserva o rascunho", async () => {
    const root = createRoot();
    const detail = await observeNote(root.id);
    useReplyNoteCacheStore.getState().update({
      content: "Não perder", noteImages: ["file:///preservar.jpg"], noteEmotions: [9999],
    });
    await expect(saveReply(String(root.id))).rejects.toThrow();
    expect(testDb.select().from(notes).all()).toHaveLength(1);
    expect(testDb.select().from(noteReplies).all()).toEqual([]);
    expect(testDb.select().from(noteImages).all()).toEqual([]);
    expect(detail.getCurrentResult().data).toEqual(root);
    expect(useReplyNoteCacheStore.getState().note).toMatchObject({
      content: "Não perder", noteImages: ["file:///preservar.jpg"], noteEmotions: [9999],
    });
  });

  test("salvar mensagens sucessivas mantém a conversa inteira sincronizada no estado", async () => {
    const root = createRoot();
    const feed = await observeFeed();
    const detail = await observeNote(root.id);
    for (const content of ["Primeira", "Segunda", "Terceira"]) {
      useReplyNoteCacheStore.getState().update({ content });
      await saveReply(String(root.id));
    }
    expect(detail.getCurrentResult().data?.thread.map(item => item.reply.content)).toEqual(["Primeira", "Segunda", "Terceira"]);
    expect(detail.getCurrentResult().data).toEqual(feed.getCurrentResult().data?.[0]);
    expect(feed.getCurrentResult().data).toHaveLength(1);
  });

  test.each(["", "inválido", "0", "-1", "1.5"])("não salva resposta com ID inválido %j", async (noteId) => {
    useReplyNoteCacheStore.getState().update({ content: "Preservar" });
    await expect(saveReply(noteId)).rejects.toThrow();
    expect(useReplyNoteCacheStore.getState().note.content).toBe("Preservar");
    expect(testDb.select().from(notes).all()).toEqual([]);
  });

  test("não salva resposta sem sessão", async () => {
    const root = createRoot();
    useReplyNoteCacheStore.getState().update({ content: "Preservar" });
    useAuthStore.getState().logout();
    await expect(saveReply(String(root.id))).rejects.toThrow();
    expect(testDb.select().from(noteReplies).all()).toEqual([]);
  });

  test("responder a outra nota não substitui a nota aberta", async () => {
    const root = createRoot();
    const opened = createRoot("Manter aberta");
    const detail = await observeNote(opened.id);
    useReplyNoteCacheStore.getState().update({ content: "Resposta" });
    await saveReply(String(root.id));
    expect(detail.getCurrentResult().data).toEqual(opened);
  });

  test("editar os recursos de uma resposta não altera a nota original nem as outras mensagens", async () => {
    const root = createRoot();
    const first = NoteRepository.createReply(root.id, { userId: ownerId, content: "Primeira", noteImages: ["file:///antiga.jpg"] });
    const second = NoteRepository.createReply(root.id, { userId: ownerId, content: "Segunda" });
    NoteRepository.update(first.reply.id, { content: "Editada", noteImages: ["file:///nova.jpg"] });

    const persisted = await NoteRepository.findOne(root.id);
    expect(persisted).toMatchObject({
      content: "Nota original", noteImages: [],
      thread: [
        { reply: { id: first.reply.id, content: "Editada", noteImages: [{ imageUrl: "file:///nova.jpg" }] } },
        { reply: { id: second.reply.id, content: "Segunda", noteImages: [] } },
      ],
    });
  });

  test("excluir uma mensagem preserva a nota original e as outras respostas", async () => {
    const root = createRoot();
    const first = NoteRepository.createReply(root.id, { userId: ownerId, content: "Apagar", noteImages: ["file:///apagar.jpg"] });
    const second = NoteRepository.createReply(root.id, { userId: ownerId, content: "Preservar" });
    await NoteRepository.delete(first.reply.id);
    expect((await NoteRepository.findOne(root.id))?.thread.map(item => item.reply.id)).toEqual([second.reply.id]);
    expect(testDb.select().from(noteImages).all()).toEqual([]);
  });

  test("excluir a nota original remove respostas e recursos sem deixar registros órfãos", async () => {
    const root = createRoot();
    const unrelated = createRoot("Preservar");
    NoteRepository.createReply(root.id, { userId: ownerId, content: "Primeira", noteImages: ["file:///foto.jpg"] });
    NoteRepository.createReply(root.id, { userId: ownerId, content: "Segunda" });
    await NoteRepository.delete(root.id);

    expect(testDb.select().from(notes).all().map(note => note.id)).toEqual([unrelated.id]);
    for (const table of [noteReplies, noteImages, noteEmotions, noteThoughts, noteReactions, noteBehaviors]) {
      expect(testDb.select().from(table).all()).toEqual([]);
    }
    expect(sqlite.query("PRAGMA foreign_key_check").all()).toEqual([]);
  });

  test("não permite resposta solta pelo caminho de criação de notas", () => {
    expect(() => NoteRepository.create({ userId: ownerId, noteType: "reply", content: "Solta" }))
      .toThrow(ValidationException);
    expect(testDb.select().from(notes).all()).toEqual([]);
  });

  test("uma nota apagada não recebe novas respostas", async () => {
    const root = createRoot();
    testDb.update(notes).set({ deletedAt: new Date() }).where(eq(notes.id, root.id)).run();
    useReplyNoteCacheStore.getState().update({ content: "Preservar" });
    await expect(saveReply(String(root.id))).rejects.toThrow();
    expect(testDb.select().from(noteReplies).all()).toEqual([]);
  });
});
