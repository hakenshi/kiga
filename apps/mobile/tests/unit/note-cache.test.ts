import { afterEach, beforeEach, describe, expect, setSystemTime, test } from "bun:test";
import { storageValues as values } from "../helpers/storage";
import { selectDraftImageCount, selectDraftWordCount } from "../../src/stores/note-draft";

const { useAuthStore } = await import("../../src/stores/auth-store");
const { useNewNoteCacheStore } = await import("../../src/stores/new-note-cache-store");
const { useEditNoteCacheStore } = await import("../../src/stores/edit-note-cache-store");
const { useReplyNoteCacheStore } = await import("../../src/stores/reply-note-cache-store");
const { useRepostNoteCacheStore } = await import("../../src/stores/repost-note-cache-store");
const { revalidateNoteCaches } = await import("../../src/stores/revalidate-note-caches");

const caches = [
  ["newNoteDraft", useNewNoteCacheStore],
  ["editNoteDraft", useEditNoteCacheStore],
  ["replyNoteDraft", useReplyNoteCacheStore],
  ["repostNoteDraft", useRepostNoteCacheStore],
] as const;

const user: User = {
  id: 7,
  username: "cache_test",
  firstName: "Cache",
  secondName: "Test",
  birthDate: new Date(2000, 0, 1),
  gender: null,
  pronoun: null,
  createdAt: new Date(2026, 0, 1),
};

beforeEach(() => {
  values.clear();
  useAuthStore.getState().setUser({ user, isAuthenticated: true });
  for (const [, store] of caches) store.getState().clear();
});

afterEach(() => {
  setSystemTime();
  for (const [, store] of caches) store.getState().clear();
  useAuthStore.getState().logout();
  values.clear();
});

describe.each(caches)("%s", (key, store) => {
  test("mescla alterações e renova somente seu prazo", () => {
    const other = store === useNewNoteCacheStore ? useReplyNoteCacheStore : useNewNoteCacheStore;
    other.getState().update({ content: "outro rascunho" });
    const otherDeadline = other.getState().expiresAt;
    const before = Date.now();

    store.getState().update({ content: "texto", moodId: 3 });
    store.getState().update({ content: "texto atualizado" });

    expect(store.getState().note).toMatchObject({ content: "texto atualizado", moodId: 3, userId: user.id });
    expect(store.getState().expiresAt).toBeGreaterThanOrEqual(before + 15 * 60_000);
    expect(other.getState().expiresAt).toBe(otherDeadline);
  });

  test("limpa somente o próprio rascunho", () => {
    const other = store === useNewNoteCacheStore ? useReplyNoteCacheStore : useNewNoteCacheStore;
    other.getState().update({ content: "preservar" });
    store.getState().update({ content: "descartar", noteImages: ["file:///foto.jpg"] });

    store.getState().clear();

    expect(store.getState().note.content).toBe("");
    expect(store.getState().note.noteImages).toBeUndefined();
    expect(store.getState().expiresAt).toBe(0);
    expect(other.getState().note.content).toBe("preservar");
  });

  test("revalidate preserva um cache válido sem renovar o prazo", () => {
    store.getState().update({ content: "válido" });
    const deadline = store.getState().expiresAt;

    expect(store.getState().revalidate()).toBe(true);
    expect(store.getState().note.content).toBe("válido");
    expect(store.getState().expiresAt).toBe(deadline);
  });

  test("revalidate descarta um cache expirado sem depender de ticks", () => {
    store.getState().update({ content: "expirado" });
    store.setState({ expiresAt: Date.now() - 1 });

    expect(store.getState().revalidate()).toBe(false);
    expect(store.getState().note.content).toBe("");
    expect(store.getState().expiresAt).toBe(0);
  });

  test("não mistura dados expirados com uma nova alteração", () => {
    store.getState().update({ content: "antigo", noteImages: ["file:///antiga.jpg"] });
    store.setState({ expiresAt: Date.now() - 1 });

    store.getState().addImages(["file:///nova.jpg"]);

    expect(store.getState().note.content).toBe("");
    expect(store.getState().note.noteImages).toEqual(["file:///nova.jpg"]);
  });

  test("seleciona e desmarca humor e recursos no próprio estado", () => {
    store.getState().toggleMood(4);
    expect(store.getState().note.moodId).toBe(4);
    store.getState().toggleMood(4);
    expect(store.getState().note.moodId).toBeNull();

    store.getState().toggleResource("noteEmotions", 10);
    store.getState().toggleResource("noteEmotions", 20);
    store.getState().removeResources("noteEmotions", [10]);
    expect(store.getState().note.noteEmotions).toEqual([20]);
    store.getState().toggleResource("noteEmotions", 20);
    expect(store.getState().note.noteEmotions).toEqual([]);
  });

  test("acrescenta, substitui e remove somente as imagens solicitadas", () => {
    store.getState().addImages(["file:///foto.jpg", "file:///foto.jpg.backup"]);
    store.getState().addImages(["file:///outra.jpg"]);
    store.getState().removeImage("file:///foto.jpg");
    store.getState().replaceImage("file:///outra.jpg", "file:///recortada.jpg");

    expect(store.getState().note.noteImages).toEqual(["file:///foto.jpg.backup", "file:///recortada.jpg"]);
  });

  test("não reidrata dados que expiraram com o app fechado", async () => {
    expect(store.persist.getOptions().name).toBe(key);
    values.set(key, JSON.stringify({
      state: { note: { content: "expirado", userId: user.id }, expiresAt: Date.now() - 1 },
      version: 0,
    }));

    await store.persist.rehydrate();

    expect(store.getState().note.content).toBe("");
    expect(store.getState().expiresAt).toBe(0);
  });

  test("expira exatamente no limite do prazo", () => {
    setSystemTime(new Date(2026, 10, 19, 12));
    store.getState().update({ content: "Temporário" });
    setSystemTime(store.getState().expiresAt);
    expect(store.getState().revalidate()).toBe(false);
    expect(store.getState().note.content).toBe("");
  });

  test("rehidrata dados válidos, preserva ações e descarta dados malformados", async () => {
    const expiresAt = Date.now() + 60_000;
    values.set(key, JSON.stringify({
      state: { note: { content: "Recuperado", userId: user.id }, expiresAt }, version: 0,
    }));
    await store.persist.rehydrate();
    expect(store.getState().note.content).toBe("Recuperado");
    expect(store.getState().expiresAt).toBe(expiresAt);
    expect(typeof store.getState().update).toBe("function");
    store.getState().clear();
    values.set(key, JSON.stringify({
      state: { note: { content: 123 }, expiresAt }, version: 0,
    }));
    await store.persist.rehydrate();
    expect(store.getState().note.content).toBe("");
  });

  test("os seletores contam os recursos reais do rascunho", () => {
    expect(selectDraftWordCount(store.getState())).toBe(0);
    expect(selectDraftImageCount(store.getState())).toBe(0);
    store.getState().update({ content: "  Uma\nnova resposta  ", noteImages: ["file:///1.jpg", "file:///2.jpg"] });
    expect(selectDraftWordCount(store.getState())).toBe(3);
    expect(selectDraftImageCount(store.getState())).toBe(2);
  });

  test.each(["noteThoughts", "noteReactions", "noteBehaviors"] as const)("seleciona e remove IDs de %s independentemente", (resource) => {
    store.getState().toggleResource(resource, 1);
    store.getState().toggleResource(resource, 2);
    store.getState().removeResources(resource, [1]);
    expect(store.getState().note[resource]).toEqual([2]);
    store.getState().toggleResource(resource, 2);
    expect(store.getState().note[resource]).toEqual([]);
  });
});

test("revalidação conjunta respeita os prazos independentes", () => {
  useNewNoteCacheStore.getState().update({ content: "expirado" });
  useNewNoteCacheStore.setState({ expiresAt: Date.now() - 1 });
  useEditNoteCacheStore.getState().update({ content: "válido" });
  const editDeadline = useEditNoteCacheStore.getState().expiresAt;

  revalidateNoteCaches();

  expect(useNewNoteCacheStore.getState().note.content).toBe("");
  expect(useEditNoteCacheStore.getState().note.content).toBe("válido");
  expect(useEditNoteCacheStore.getState().expiresAt).toBe(editDeadline);
});

test("revalidação descarta rascunhos de outro usuário", () => {
  for (const [, store] of caches) store.getState().update({ content: "privado" });
  useAuthStore.getState().setUser({ user: { ...user, id: 8 }, isAuthenticated: true });

  revalidateNoteCaches();

  for (const [, store] of caches) {
    expect(store.getState().note.content).toBe("");
    expect(store.getState().expiresAt).toBe(0);
  }
});

test("cada store persiste em uma chave própria e recupera datas", async () => {
  const keys = caches.map(([, store]) => store.persist.getOptions().name);
  expect(new Set(keys).size).toBe(4);
  const date = new Date(2026, 0, 10, 12);
  values.set("newNoteDraft", JSON.stringify({
    state: { note: { content: "salvo", userId: user.id, date }, expiresAt: Date.now() + 60_000 },
    version: 0,
  }));

  await useNewNoteCacheStore.persist.rehydrate();

  expect(useNewNoteCacheStore.getState().note.date).toEqual(date);
  expect(useReplyNoteCacheStore.getState().note.content).toBe("");
  expect(typeof useNewNoteCacheStore.getState().update).toBe("function");
});

test("carregar a mesma edição preserva mudanças ainda não salvas", () => {
  const note: Note = {
    id: 42,
    userId: user.id,
    content: "original",
    noteType: "note",
    moodId: null,
    liked: false,
    fixed: false,
    date: new Date(2026, 0, 10),
    createdAt: new Date(2026, 0, 10),
    updatedAt: null,
    deletedAt: null,
    noteBehaviors: [],
    noteEmotions: [],
    noteImages: [{ id: 1, noteId: 42, imageUrl: "file:///original.jpg" }],
    noteReactions: [],
    noteThoughts: [],
    mood: null,
    isRepost: false,
    isPureRepost: false,
    thread: [],
    reposts: [],
  };

  useEditNoteCacheStore.getState().load(note);
  useEditNoteCacheStore.getState().update({ content: "editado" });
  useEditNoteCacheStore.getState().load(note);

  expect(useEditNoteCacheStore.getState().note).toMatchObject({
    id: 42,
    content: "editado",
    noteImages: ["file:///original.jpg"],
  });
  useEditNoteCacheStore.getState().load({ ...note, id: 43, content: "outra nota" });
  expect(useEditNoteCacheStore.getState().note).toMatchObject({ id: 43, content: "outra nota" });
});
