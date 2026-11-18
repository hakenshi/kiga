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
import { and, desc, eq, isNull } from "drizzle-orm";
import { BaseRepository, Tx } from "./base-repository";

export interface NoteFilterOptions {
  userId: number;
}

export class NoteRepository extends BaseRepository {
  public static async findMany(userId: number, options: { limit: number, offset: number }): Promise<Note[]> {
    const { limit = 20, offset = 0 } = options
    const rows = await db.query.notes.findMany({
      where: and(
        eq(notes.userId, userId),
        isNull(notes.deletedAt)
      ),
      orderBy: [desc(notes.fixed), desc(notes.deletedAt), desc(notes.id)],
      limit,
      offset,
      with: {
        noteBehaviors: { with: { behavior: true } },
        noteEmotions: { with: { emotion: true } },
        noteImages: true,
        noteReactions: { with: { reaction: true } },
        noteThoughts: { with: { thought: true } },
        mood: true,
        thread: true,
        reposts: true
      },
    });
    return rows.map(note => {
      const isRepost = note.noteType === "repost";
      return noteSelectSchema.parse({
        ...note,
        isRepost,
        isPureRepost: isRepost && note.content.trim().length === 0,
      });
    });
  }

  public static async findOne(noteId: number) {
    return this.readNote(db, noteId);
  }

  private static readNote(connection: typeof db | Tx, noteId: number): Note | undefined {
    const note = connection.query.notes.findFirst({
      where: and(
        eq(notes.id, noteId),
        isNull(notes.deletedAt)
      ),
      with: {
        noteBehaviors: { with: { behavior: true } },
        noteEmotions: { with: { emotion: true } },
        noteImages: true,
        noteReactions: { with: { reaction: true } },
        noteThoughts: { with: { thought: true } },
        mood: true,
        reposts: true,
        thread: true,
      },
    }).sync();
    if (!note) return note;
    const isRepost = note.noteType === "repost";
    return noteSelectSchema.parse({
      ...note,
      isRepost,
      isPureRepost: isRepost && note.content.trim().length === 0,
    });
  }

  public static search(query: string, filters: NoteFilterOptions): Note[] {
    const rows = db.query.notes.findMany({
      where: and(
        eq(notes.userId, filters.userId),
        isNull(notes.deletedAt),
        this.searchText(notes.content, query.trim()),
      ),
      orderBy: [desc(notes.fixed), desc(notes.deletedAt), desc(notes.id)],
      with: {
        noteBehaviors: { with: { behavior: true } },
        noteEmotions: { with: { emotion: true } },
        noteImages: true,
        noteReactions: { with: { reaction: true } },
        noteThoughts: { with: { thought: true } },
        mood: true,
        thread: true,
        reposts: true,
      },
    }).sync();

    return rows.map(note => {
      const isRepost = note.noteType === "repost";
      return noteSelectSchema.parse({
        ...note,
        isRepost,
        isPureRepost: isRepost && note.content.trim().length === 0,
      });
    });
  }

  public static create(data: NoteInsert) {
    return db.transaction((tx) => {
      const [newNote] = this.insert(tx, data, noteInsertSchema, notes)

      if (!newNote) {
        throw new DatabaseException("Falha ao criar nova nota")
      }

      this.insertRelations(tx, newNote.id, data)

      if (data.noteType === "reply") {
        this.reply(tx, newNote.id)
      }
      else if (data.noteType === "repost") {
        this.repost(tx, newNote.id)
      }

      const note = this.readNote(tx, newNote.id);
      if (!note) {
        throw new DatabaseException("Falha ao consultar a nota criada");
      }
      return note;
    })
  }

  private static reply(tx: Tx, noteId: number) {
    this.insert(tx, { noteId }, noteRepliesInsertSchema, noteReplies)
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
    return await db.delete(notes).where(eq(notes.id, noteId)).returning()
  }
}
