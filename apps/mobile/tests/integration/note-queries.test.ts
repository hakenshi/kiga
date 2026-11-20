import { afterEach, beforeEach, describe, expect, jest, mock, spyOn, test } from "bun:test";
import {
  InfiniteQueryObserver, MutationObserver, onlineManager, QueryObserver, type QueryClient,
} from "@tanstack/react-query";
import { z } from "zod";
import { createQueryClient } from "../../src/lib/query-client";
import {
  flattenNotePages, getComposerContext, getNoteBody, loadEditNote,
  noteKeys, noteMutations, noteQueries, visibleNotes,
} from "../../src/queries/notes/queries";
import { NoteRepository } from "../../src/repositories/note-repository";
import { useAuthStore } from "../../src/stores/auth-store";
import { useEditNoteCacheStore } from "../../src/stores/edit-note-cache-store";
import { useNewNoteCacheStore } from "../../src/stores/new-note-cache-store";
import { useReplyNoteCacheStore } from "../../src/stores/reply-note-cache-store";
import { useRepostNoteCacheStore } from "../../src/stores/repost-note-cache-store";
import { useToastStore } from "../../src/stores/toast-store";
import { resetDatabase } from "../helpers/database";
import { makeNote } from "../helpers/fixtures";
import { seedUsers } from "../helpers/seed";

let client: QueryClient;
let user: User;
let other: User;
const subscriptions: (() => void)[] = [];
const drafts = [useNewNoteCacheStore, useEditNoteCacheStore, useReplyNoteCacheStore, useRepostNoteCacheStore];

beforeEach(() => {
  resetDatabase();
  const seeded = seedUsers();
  user = seeded.owner;
  other = seeded.other;
  client = createQueryClient();
  useAuthStore.getState().setUser({ user, isAuthenticated: true });
  drafts.forEach(store => store.getState().clear());
});

afterEach(() => {
  subscriptions.splice(0).forEach(unsubscribe => unsubscribe());
  client.clear();
  useToastStore.getState().dismiss();
  drafts.forEach(store => store.getState().clear());
  useAuthStore.getState().logout();
  onlineManager.setOnline(true);
  mock.restore();
  jest.useRealTimers();
});

function createNote(content = "Registro local") {
  return NoteRepository.create({ userId: user.id, noteType: "note", content });
}

async function flushMicrotasks() {
  for (let i = 0; i < 8; i++) await Promise.resolve();
}

function deletedIds() {
  return client.getMutationCache().findAll({
    mutationKey: noteKeys.remove(user.id), status: "pending",
  }).map(mutation => z.number().parse(mutation.state.variables));
}

describe("queries locais e chaves de cache", () => {
  test("detalhe sem cache já contém a nota na criação do observer", () => {
    const note = createNote();
    const options = noteQueries.detail(user.id, note.id);
    expect(client.getQueryData(options.queryKey)).toBeUndefined();
    const observer = new QueryObserver(client, options);
    expect(observer.getCurrentResult().data).toEqual(note);
    expect(observer.getCurrentResult().isPending).toBe(false);
    expect(observer.getCurrentResult().isFetching).toBe(false);
  });

  test("feed sem cache já começa preenchido, sem estado vazio intermediário", () => {
    const note = createNote();
    const observer = new InfiniteQueryObserver(client, noteQueries.feed(user.id));
    expect(observer.getCurrentResult().data).toEqual([note]);
    expect(observer.getCurrentResult().isPending).toBe(false);
  });

  test("busca sem cache já fornece o resultado no primeiro snapshot", () => {
    const note = createNote("Encontrar esta nota");
    const observer = new QueryObserver(client, noteQueries.search(user.id, "Encontrar"));
    expect(observer.getCurrentResult().data).toEqual([note]);
    expect(observer.getCurrentResult().isPending).toBe(false);
  });

  test("falha na leitura inicial é tratada pelo fluxo de erro da query", async () => {
    const error = new Error("Falha SQLite");
    spyOn(NoteRepository, "findOne").mockImplementation(() => { throw error; });
    await expect(client.fetchQuery(noteQueries.detail(user.id, 1))).rejects.toThrow(error);
    expect(useToastStore.getState().currentToast?.type).toBe("error");
  });

  test("consulta e grava SQLite mesmo quando o React Query está offline", async () => {
    onlineManager.setOnline(false);
    const mutation = new MutationObserver(client, noteMutations.create(client, user.id));
    const created = await mutation.mutate({ userId: user.id, noteType: "note", content: "Sem rede" });
    expect(await client.fetchQuery(noteQueries.detail(user.id, created.id))).toMatchObject({ content: "Sem rede" });
  });

  test("reutiliza o cache de detalhe sem consultar o repository novamente", async () => {
    const note = createNote();
    const find = spyOn(NoteRepository, "findOne");
    await client.fetchQuery(noteQueries.detail(user.id, note.id));
    await client.fetchQuery(noteQueries.detail(user.id, note.id));
    expect(find).toHaveBeenCalledTimes(1);
  });

  test("deduplica consultas simultâneas do mesmo detalhe", async () => {
    const pending = Promise.withResolvers<Note | null>();
    const find = mock(() => pending.promise);
    const options = { ...noteQueries.detail(user.id, 42), initialData: undefined, queryFn: find };
    const first = client.fetchQuery(options);
    const second = client.fetchQuery(options);
    expect(find).toHaveBeenCalledTimes(1);
    pending.resolve(makeNote({ userId: user.id }));
    expect(await first).toEqual(await second);
  });

  test("isola usuários, detalhes, feed e buscas nas chaves", () => {
    const keys = [
      noteKeys.feed(user.id), noteKeys.feed(other.id),
      noteKeys.detail(user.id, 1), noteKeys.detail(user.id, 2),
      noteKeys.search(user.id, "primeira"), noteKeys.search(user.id, "segunda"),
    ];
    expect(new Set(keys.map(key => JSON.stringify(key))).size).toBe(keys.length);
    expect(noteKeys.search(user.id, "  busca  ")).toEqual(noteKeys.search(user.id, "busca"));
  });

  test("não entrega o detalhe de uma nota de outra conta", async () => {
    const note = createNote();
    expect(await client.fetchQuery(noteQueries.detail(other.id, note.id))).toBeNull();
    expect(await client.fetchQuery(noteQueries.detail(user.id, 9999))).toBeNull();
  });

  test.each(["", "inválido", "0", "-1", "1.5"])("não habilita detalhe para a rota inválida %j", (id) => {
    expect(noteQueries.detail(user.id, id).enabled).toBe(false);
  });

  test("uma busca vazia de resultados não reutiliza notas de outra busca", async () => {
    const note = createNote("Texto encontrado");
    expect(await client.fetchQuery(noteQueries.search(user.id, "encontrado"))).toEqual([note]);
    expect(await client.fetchQuery(noteQueries.search(user.id, "inexistente"))).toEqual([]);
    expect(await client.fetchQuery(noteQueries.search(user.id, "  encontrado  "))).toEqual([note]);
  });

  test("erros locais não são repetidos automaticamente e são apresentados ao usuário", async () => {
    const error = new Error("SQLITE_BUSY");
    const find = spyOn(NoteRepository, "findOne").mockImplementation(() => { throw error; });
    await expect(client.fetchQuery({ ...noteQueries.detail(user.id, 1), initialData: undefined })).rejects.toThrow(error);
    expect(find).toHaveBeenCalledTimes(1);
    expect(useToastStore.getState().currentToast?.type).toBe("error");
  });

  test("uma consulta com erro mantém o último dado válido no cache", async () => {
    const note = createNote();
    const options = noteQueries.detail(user.id, note.id);
    await client.fetchQuery(options);
    await client.invalidateQueries({ queryKey: options.queryKey });
    spyOn(NoteRepository, "findOne").mockImplementationOnce(() => { throw new Error("Falha SQLite"); });
    await expect(client.fetchQuery(options)).rejects.toThrow();
    expect(client.getQueryData(options.queryKey)).toEqual(note);
  });
});

describe("paginação", () => {
  test("carrega páginas de 20 itens e encerra na página incompleta", async () => {
    const first = Array.from({ length: 20 }, (_, id) => makeNote({ id, userId: user.id }));
    const last = [makeNote({ id: 21, userId: user.id })];
    const find = spyOn(NoteRepository, "findMany").mockReturnValueOnce(first).mockReturnValueOnce(last);
    const observer = new InfiniteQueryObserver(client, { ...noteQueries.feed(user.id), initialData: undefined });
    subscriptions.push(observer.subscribe(() => {}));
    await observer.refetch();
    expect(observer.getCurrentResult().hasNextPage).toBe(true);
    await observer.fetchNextPage();
    expect(find).toHaveBeenNthCalledWith(1, user.id, { limit: 20, offset: 0 });
    expect(find).toHaveBeenNthCalledWith(2, user.id, { limit: 20, offset: 20 });
    expect(observer.getCurrentResult().data).toEqual([...first, ...last]);
    expect(observer.getCurrentResult().hasNextPage).toBe(false);
    await observer.fetchNextPage();
    expect(find).toHaveBeenCalledTimes(2);
  });

  test("uma página vazia encerra um feed que tinha exatamente 20 registros", async () => {
    spyOn(NoteRepository, "findMany")
      .mockReturnValueOnce(Array.from({ length: 20 }, (_, id) => makeNote({ id, userId: user.id })))
      .mockReturnValueOnce([]);
    const observer = new InfiniteQueryObserver(client, { ...noteQueries.feed(user.id), initialData: undefined });
    subscriptions.push(observer.subscribe(() => {}));
    await observer.refetch();
    await observer.fetchNextPage();
    expect(observer.getCurrentResult().hasNextPage).toBe(false);
    expect(observer.getCurrentResult().data).toHaveLength(20);
  });

  test("falha de uma página seguinte preserva as páginas anteriores", async () => {
    const notes = Array.from({ length: 20 }, (_, id) => makeNote({ id, userId: user.id }));
    spyOn(NoteRepository, "findMany").mockReturnValueOnce(notes).mockImplementationOnce(() => { throw new Error("Falha SQLite"); });
    const observer = new InfiniteQueryObserver(client, { ...noteQueries.feed(user.id), initialData: undefined });
    subscriptions.push(observer.subscribe(() => {}));
    await observer.refetch();
    await observer.fetchNextPage();
    expect(observer.getCurrentResult().data).toEqual(notes);
    expect(observer.getCurrentResult().isFetching).toBe(false);
    expect(observer.getCurrentResult().isFetchNextPageError).toBe(true);
  });

  test("o seletor mantém a ordem das páginas", () => {
    const first = makeNote({ id: 1 });
    const second = makeNote({ id: 2 });
    expect(flattenNotePages({ pages: [[first], [second]], pageParams: [0, 20] })).toEqual([first, second]);
  });
});

describe("mutations e rascunhos dedicados", () => {
  test("abre a edição pelo React Query e carrega somente o rascunho correspondente", async () => {
    const note = createNote();
    useNewNoteCacheStore.getState().update({ content: "Manter nova nota" });
    const find = spyOn(NoteRepository, "findOne");

    expect(await loadEditNote(client, user.id, note.id)).toBe(true);
    expect(useEditNoteCacheStore.getState().note).toMatchObject({ id: note.id, content: note.content });
    expect(useNewNoteCacheStore.getState().note.content).toBe("Manter nova nota");
    expect(client.getQueryData(noteKeys.detail(user.id, note.id))).toEqual(note);

    expect(await loadEditNote(client, user.id, note.id)).toBe(true);
    expect(find).toHaveBeenCalledTimes(1);
  });

  test("nota ausente ou de outra conta não substitui o rascunho de edição", async () => {
    useEditNoteCacheStore.getState().update({ content: "Preservar edição" });
    const privateNote = NoteRepository.create({ userId: other.id, noteType: "note", content: "Privado" });

    expect(await loadEditNote(client, user.id, 9999)).toBe(false);
    expect(await loadEditNote(client, user.id, privateNote.id)).toBe(false);
    expect(useEditNoteCacheStore.getState().note.content).toBe("Preservar edição");
  });

  test("falha ao abrir a edição preserva o rascunho e apresenta o erro da query", async () => {
    useEditNoteCacheStore.getState().update({ content: "Preservar edição" });
    spyOn(NoteRepository, "findOne").mockImplementation(() => { throw new Error("Falha SQLite"); });

    expect(await loadEditNote(client, user.id, 1)).toBe(false);
    expect(useEditNoteCacheStore.getState().note.content).toBe("Preservar edição");
    expect(useToastStore.getState().currentToast?.type).toBe("error");
  });

  test("criação invalida o feed e a busca ativos", async () => {
    const feed = new InfiniteQueryObserver(client, noteQueries.feed(user.id));
    const search = new QueryObserver(client, noteQueries.search(user.id, "Nova"));
    subscriptions.push(feed.subscribe(() => {}), search.subscribe(() => {}));
    await Promise.all([feed.refetch(), search.refetch()]);
    const created = await new MutationObserver(client, noteMutations.create(client, user.id))
      .mutate({ userId: user.id, noteType: "note", content: "Nova nota" });
    expect(feed.getCurrentResult().data).toEqual([created]);
    expect(search.getCurrentResult().data).toEqual([created]);
  });

  test("editar atualiza os detalhes e buscas observados sem sincronização manual", async () => {
    const note = createNote();
    const detail = new QueryObserver(client, noteQueries.detail(user.id, note.id));
    const search = new QueryObserver(client, noteQueries.search(user.id, "Editada"));
    subscriptions.push(detail.subscribe(() => {}), search.subscribe(() => {}));
    await Promise.all([detail.refetch(), search.refetch()]);
    await new MutationObserver(client, noteMutations.update(client, user.id))
      .mutate({ noteId: note.id, data: { content: "Editada", liked: true } });
    expect(detail.getCurrentResult().data).toMatchObject({ content: "Editada", liked: true });
    expect(search.getCurrentResult().data).toMatchObject([{ id: note.id, content: "Editada" }]);
  });

  test("criar pelo rascunho limpa apenas o rascunho da nova nota", async () => {
    useNewNoteCacheStore.getState().update({ content: "Nova nota", noteImages: ["file:///foto.jpg"] });
    useReplyNoteCacheStore.getState().update({ content: "Preservar resposta" });
    const note = await new MutationObserver(client, noteMutations.createDraft(client, user.id)).mutate();
    expect(note).toMatchObject({ noteType: "note", content: "Nova nota", noteImages: [{ imageUrl: "file:///foto.jpg" }] });
    expect(useNewNoteCacheStore.getState().expiresAt).toBe(0);
    expect(useReplyNoteCacheStore.getState().note.content).toBe("Preservar resposta");
  });

  test("a página de edição salva seu rascunho explicitamente", async () => {
    const note = createNote();
    useEditNoteCacheStore.getState().load(note);
    useEditNoteCacheStore.getState().update({ content: "Edição salva" });
    const saved = await new MutationObserver(client, noteMutations.updateDraft(client, user.id)).mutate();
    expect(saved).toMatchObject({ id: note.id, content: "Edição salva" });
    expect(useEditNoteCacheStore.getState().expiresAt).toBe(0);
  });

  test("a página de repost usa sua mutation e seu próprio rascunho", async () => {
    useRepostNoteCacheStore.getState().update({ content: "Minha reflexão" });
    const note = await new MutationObserver(client, noteMutations.repostDraft(client, user.id)).mutate();
    expect(note).toMatchObject({ noteType: "repost", content: "Minha reflexão", isRepost: true });
    expect(useRepostNoteCacheStore.getState().expiresAt).toBe(0);
  });

  test("falha de gravação não limpa o rascunho", async () => {
    useNewNoteCacheStore.getState().update({ content: "Preservar", noteEmotions: [9999] });
    await expect(new MutationObserver(client, noteMutations.createDraft(client, user.id)).mutate()).rejects.toThrow();
    expect(useNewNoteCacheStore.getState().note.content).toBe("Preservar");
    expect(await NoteRepository.findMany(user.id, { limit: 20, offset: 0 })).toEqual([]);
  });

  test("rascunho expirado não é salvo nem misturado a uma nova nota", async () => {
    useNewNoteCacheStore.getState().update({ content: "Expirado" });
    useNewNoteCacheStore.setState({ expiresAt: Date.now() - 1 });
    await expect(new MutationObserver(client, noteMutations.createDraft(client, user.id)).mutate()).rejects.toThrow();
    expect(useNewNoteCacheStore.getState().note.content).toBe("");
    expect(await NoteRepository.findMany(user.id, { limit: 20, offset: 0 })).toEqual([]);
  });

  test("rascunho de outra conta não é salvo na sessão atual", async () => {
    useNewNoteCacheStore.getState().update({ content: "Privado" });
    useAuthStore.getState().setUser({ user: other, isAuthenticated: true });
    await expect(new MutationObserver(client, noteMutations.createDraft(client, other.id)).mutate()).rejects.toThrow();
    expect(await NoteRepository.findMany(other.id, { limit: 20, offset: 0 })).toEqual([]);
  });

  test("mutation vinculada à sessão anterior não grava após logout", async () => {
    const options = noteMutations.create(client, user.id);
    useAuthStore.getState().logout();
    await expect(new MutationObserver(client, options).mutate({ userId: user.id, content: "Não salvar" })).rejects.toThrow();
  });

  test("invalida somente as consultas da conta alterada", async () => {
    const own = createNote();
    const privateNote = NoteRepository.create({ userId: other.id, noteType: "note", content: "Privado" });
    const otherOptions = noteQueries.detail(other.id, privateNote.id);
    await client.fetchQuery(otherOptions);
    await new MutationObserver(client, noteMutations.update(client, user.id))
      .mutate({ noteId: own.id, data: { content: "Editado" } });
    expect(client.getQueryState(otherOptions.queryKey)?.isInvalidated).toBe(false);
    expect(client.getQueryData(otherOptions.queryKey)).toEqual(privateNote);
  });

  test("erros de validação apresentam apenas a primeira mensagem", async () => {
    spyOn(NoteRepository, "create").mockImplementationOnce(() => {
      throw new z.ZodError([
        { code: "custom", path: ["content"], message: "Primeiro erro" },
        { code: "custom", path: ["date"], message: "Segundo erro" },
      ]);
    });
    await expect(new MutationObserver(client, noteMutations.create(client, user.id))
      .mutate({ userId: user.id, content: "Texto" })).rejects.toThrow();
    expect(useToastStore.getState().currentToast?.message).toBe("Primeiro erro");
  });
});

describe("exclusão otimista com desfazer", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  test("oculta pelo estado da mutation e aguarda 4500ms antes de apagar", async () => {
    const note = createNote();
    const remove = spyOn(NoteRepository, "delete");
    const mutation = new MutationObserver(client, noteMutations.remove(client, user.id));
    const pending = mutation.mutate(note.id);
    await flushMicrotasks();
    expect(visibleNotes([note], deletedIds())).toEqual([]);
    expect(remove).not.toHaveBeenCalled();
    jest.advanceTimersByTime(4499);
    expect(remove).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    await pending;
    expect(remove).toHaveBeenCalledWith(note.id);
    expect(await NoteRepository.findOne(note.id)).toBeUndefined();
    expect(deletedIds()).toEqual([]);
  });

  test("desfazer restaura a posição sem alterar o banco nem sobrescrever o cache", async () => {
    const first = createNote("Primeira");
    const target = createNote("Segunda");
    const last = createNote("Terceira");
    const original = [last, target, first];
    const remove = spyOn(NoteRepository, "delete");
    const pending = new MutationObserver(client, noteMutations.remove(client, user.id)).mutate(target.id);
    await flushMicrotasks();
    expect(visibleNotes(original, deletedIds())).toEqual([last, first]);
    const action = useToastStore.getState().currentToast?.onAction;
    if (!action) throw new Error("A ação de desfazer deveria estar disponível");
    action();
    expect(await pending).toEqual({ undone: true });
    jest.advanceTimersByTime(5000);
    expect(remove).not.toHaveBeenCalled();
    expect(visibleNotes(original, deletedIds())).toEqual(original);
  });

  test("falha no SQLite deixa a nota disponível e mostra erro", async () => {
    const note = createNote();
    spyOn(NoteRepository, "delete").mockRejectedValueOnce(new Error("Falha SQLite"));
    const pending = new MutationObserver(client, noteMutations.remove(client, user.id)).mutate(note.id);
    const rejection = pending.catch((error: unknown) => error);
    await flushMicrotasks();
    jest.advanceTimersByTime(4500);
    expect(await rejection).toMatchObject({ message: "Falha SQLite" });
    expect(visibleNotes([note], deletedIds())).toEqual([note]);
    expect(useToastStore.getState().currentToast?.type).toBe("error");
  });

  test("duas exclusões não sobrescrevem o estado uma da outra", async () => {
    const first = createNote("Apagar");
    const second = createNote("Desfazer");
    const remove = new MutationObserver(client, noteMutations.remove(client, user.id));
    const pendingFirst = remove.mutate(first.id);
    await flushMicrotasks();
    const pendingSecond = remove.mutate(second.id);
    await flushMicrotasks();
    expect(visibleNotes([first, second], deletedIds())).toEqual([]);
    useToastStore.getState().currentToast?.onAction?.();
    await pendingSecond;
    jest.advanceTimersByTime(4500);
    await pendingFirst;
    expect(await NoteRepository.findOne(first.id)).toBeUndefined();
    expect(await NoteRepository.findOne(second.id)).toBeDefined();
  });
});

describe("dados de apresentação das notas", () => {
  test("separa imagens, comportamentos com ícone e relatos de texto", () => {
    const behavior = (id: number, content: string | null, icon: string | null) => ({
      id, noteId: 42, behaviorId: id,
      behavior: { id, userId: user.id, categoryId: null, content, icon, orderIndex: 0, deletedAt: null, createdAt: new Date(2026, 0, 1) },
    });
    const note = makeNote({
      noteImages: [{ id: 1, noteId: 42, imageUrl: "file:///foto.jpg" }],
      noteBehaviors: [behavior(1, "Caminhar", "walk"), behavior(2, "Um relato", null), behavior(3, "  ", null), behavior(4, null, null)],
    });
    const body = getNoteBody(note);
    expect(body.images).toBe(note.noteImages);
    expect(body.behaviors.map(item => item.id)).toEqual([1]);
    expect(body.reports.map(item => item.id)).toEqual([2]);
  });

  test("prepara contexto do autor e humor fora da view", () => {
    const note = makeNote({ userId: user.id, moodId: 4 });
    expect(getComposerContext(note, user)).toMatchObject({
      note, userName: `${user.firstName} ${user.secondName}`,
      mood: { label: "Bem" }, thoughts: [], emotions: [],
    });
    expect(getComposerContext(note, null)).toMatchObject({ userName: "" });
    expect(getComposerContext(note, user)).not.toHaveProperty("authorInitial");
  });
});
