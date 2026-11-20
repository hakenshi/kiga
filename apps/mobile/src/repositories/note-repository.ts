import db from "@/lib/db";
import { noteBehaviors, noteEmotions, noteImages, noteReactions, noteReplies, noteReposts, notes, noteThoughts } from "@/lib/db/schema";
import { noteBehaviorInsertSchema } from "@/lib/db/zod/schemas/note/behavior.schema";
import { noteEmotionsInsertSchema } from "@/lib/db/zod/schemas/note/emotion.schema";
import { noteImagesInsertSchema } from "@/lib/db/zod/schemas/note/image.schema";
import { noteInsertSchema, noteSelectSchema, noteUpdateSchema } from "@/lib/db/zod/schemas/note/index.schema";
import { noteReactionsInsertSchema } from "@/lib/db/zod/schemas/note/reaction.schema";
import { noteRepliesInsertSchema } from "@/lib/db/zod/schemas/note/reply.schema";
import { noteRepostInsertSchema } from "@/lib/db/zod/schemas/note/repost.schema";
import { noteThoughtsInsertSchema } from "@/lib/db/zod/schemas/note/thought.schema";
import { DatabaseException } from "@/lib/exceptions/database/index.exception";
import { NotFoundException } from "@/lib/exceptions/not-found/index.exception";
import { ForbiddenException } from "@/lib/exceptions/forbidden/index.exception";
import { ValidationException } from "@/lib/exceptions/validation/index.exception";
import { and, asc, desc, eq, gte, inArray, isNull, lte } from "drizzle-orm";
import { BaseRepository, Tx } from "./base-repository";

export interface NoteDateRange {
  start: Date;
  end: Date;
}

export interface NoteFilterOptions {
  userId: number;
  dateRange?: NoteDateRange;
}

const noteRelations = {
  noteBehaviors: { with: { behavior: true } },
  noteEmotions: { with: { emotion: true } },
  noteImages: true,
  noteReactions: { with: { reaction: true } },
  noteThoughts: { with: { thought: true } },
  mood: true,
  reposts: true,
} as const;

const noteWithThread = {
  ...noteRelations,
  thread: {
    with: { reply: { with: noteRelations } },
    orderBy: [asc(noteReplies.id)],
  },
};

type NoteRow = Omit<Note, "isRepost" | "isPureRepost" | "thread"> & {
  thread: {
    id: number;
    noteId: number;
    reply: Omit<Note["thread"][number]["reply"], "isRepost" | "isPureRepost" | "thread">;
  }[];
};

export class NoteRepository extends BaseRepository {
  private static parseNote(note: NoteRow): Note {
    const isRepost = note.noteType === "repost";
    return noteSelectSchema.parse({
      ...note,
      isRepost,
      isPureRepost: isRepost && note.content.trim().length === 0,
      thread: note.thread.map(item => ({
        ...item,
        reply: { ...item.reply, isRepost: false, isPureRepost: false },
      })),
    });
  }

  public static findMany(userId: number, options: { limit: number; offset: number; dateRange?: NoteDateRange }): Note[] {
    const { limit = 20, offset = 0, dateRange } = options
    const rows = db.query.notes.findMany({
      where: and(
        eq(notes.userId, userId),
        isNull(notes.deletedAt),
        eq(notes.noteType, "note"),
        dateRange ? gte(notes.date, dateRange.start) : undefined,
        dateRange ? lte(notes.date, dateRange.end) : undefined,
      ),
      orderBy: [desc(notes.fixed), desc(notes.deletedAt), desc(notes.id)],
      limit,
      offset,
      with: noteWithThread,
    }).sync();
    return rows.map(note => this.parseNote(note));
  }

  public static findNoteDates(userId: number): Date[] {
    return db
      .select({ date: notes.date })
      .from(notes)
      .where(and(
        eq(notes.userId, userId),
        isNull(notes.deletedAt),
        eq(notes.noteType, "note"),
      ))
      .all()
      .map(row => row.date);
  }

  public static findOne(noteId: number) {
    return this.readNote(db, noteId);
  }

  private static readNote(connection: typeof db | Tx, noteId: number): Note | undefined {
    const note = connection.query.notes.findFirst({
      where: and(
        eq(notes.id, noteId),
        isNull(notes.deletedAt)
      ),
      with: noteWithThread,
    }).sync();
    if (!note) return note;
    return this.parseNote(note);
  }

  public static search(query: string, filters: NoteFilterOptions): Note[] {
    const rows = db.query.notes.findMany({
      where: and(
        eq(notes.userId, filters.userId),
        isNull(notes.deletedAt),
        eq(notes.noteType, "note"),
        this.searchText(notes.content, query.trim()),
        filters.dateRange ? gte(notes.date, filters.dateRange.start) : undefined,
        filters.dateRange ? lte(notes.date, filters.dateRange.end) : undefined,
      ),
      orderBy: [desc(notes.fixed), desc(notes.deletedAt), desc(notes.id)],
      with: noteWithThread,
    }).sync();

    return rows.map(note => this.parseNote(note));
  }

  public static create(data: NoteInsert) {
    if (data.noteType === "reply") {
      throw new ValidationException("Use a nota original para adicionar uma resposta.");
    }
    return db.transaction((tx) => this.insertNote(tx, data));
  }

  private static insertNote(tx: Tx, data: NoteInsert) {
    const [newNote] = this.insert(tx, data, noteInsertSchema, notes)

    if (!newNote) {
      throw new DatabaseException("Falha ao criar nova nota")
    }

    this.insertRelations(tx, newNote.id, data)

    if (data.noteType === "repost") {
      this.repost(tx, newNote.id)
    }

    const note = this.readNote(tx, newNote.id);
    if (!note) {
      throw new DatabaseException("Falha ao consultar a nota criada");
    }
    return note;
  }

  public static createReply(noteId: number, data: NoteInsert) {
    return db.transaction((tx) => {
      const note = this.readNote(tx, noteId);
      if (!note) throw new NotFoundException("Nota respondida não encontrada.");
      if (note.noteType !== "note") throw new ValidationException("Só é possível responder à nota original.");
      if (note.userId !== data.userId) throw new ForbiddenException("Não é possível responder à nota de outra conta.");

      const reply = this.insertNote(tx, { ...data, noteType: "reply" });
      this.insert(tx, { id: reply.id, noteId }, noteRepliesInsertSchema, noteReplies);

      const updatedNote = this.readNote(tx, noteId);
      if (!updatedNote) throw new DatabaseException("Falha ao consultar a nota respondida.");
      return { reply, note: updatedNote };
    });
  }

  private static repost(tx: Tx, noteId: number) {
    this.insert(tx, { noteId }, noteRepostInsertSchema, noteReposts)
  }

  private static insertRelations(tx: Tx, noteId: number, data: NoteUpdate) {
    const { noteBehaviors: behaviors = [], noteEmotions: emotions = [], noteImages: images = [], noteReactions: reactions = [], noteThoughts: thoughts = [] } = data

    behaviors.forEach((behaviorId) => this.insert(tx, { noteId, behaviorId }, noteBehaviorInsertSchema, noteBehaviors))
    emotions.forEach((emotionId) => this.insert(tx, { noteId, emotionId }, noteEmotionsInsertSchema, noteEmotions))
    images.forEach((imageUrl) => this.insert(tx, { noteId, imageUrl }, noteImagesInsertSchema, noteImages))
    reactions.forEach((reactionId) => this.insert(tx, { noteId, reactionId }, noteReactionsInsertSchema, noteReactions))
    thoughts.forEach((thoughtsId) => this.insert(tx, { noteId, thoughtsId }, noteThoughtsInsertSchema, noteThoughts))
  }

  public static update(noteId: number, data: NoteUpdate) {
    const values = noteUpdateSchema.parse(data);
    const {
      noteBehaviors: behaviors,
      noteEmotions: emotions,
      noteImages: images,
      noteReactions: reactions,
      noteThoughts: thoughts,
      ...noteValues
    } = values;

    return db.transaction((tx) => {
      const [updatedNote] = tx.update(notes)
        .set({ ...noteValues, updatedAt: new Date() })
        .where(eq(notes.id, noteId)).returning().all()

      if (!updatedNote) {
        throw new NotFoundException("Não foi possível atualizar a nota: nota não encontrada.")
      }

      if (behaviors) tx.delete(noteBehaviors).where(eq(noteBehaviors.noteId, noteId)).run()
      if (emotions) tx.delete(noteEmotions).where(eq(noteEmotions.noteId, noteId)).run()
      if (images) tx.delete(noteImages).where(eq(noteImages.noteId, noteId)).run()
      if (reactions) tx.delete(noteReactions).where(eq(noteReactions.noteId, noteId)).run()
      if (thoughts) tx.delete(noteThoughts).where(eq(noteThoughts.noteId, noteId)).run()

      this.insertRelations(tx, noteId, values)

      const note = this.readNote(tx, noteId);
      if (!note) {
        throw new DatabaseException("Falha ao consultar a nota atualizada");
      }
      return note;
    })
  }

  public static async delete(noteId: number) {
    return db.transaction((tx) => {
      const replies = tx.select({ id: noteReplies.id }).from(noteReplies).where(eq(noteReplies.noteId, noteId));
      tx.delete(notes).where(inArray(notes.id, replies)).run();
      return tx.delete(notes).where(eq(notes.id, noteId)).returning().all();
    });
  }
}
