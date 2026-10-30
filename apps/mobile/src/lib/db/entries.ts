import db from "./index";
import {
  entryEmotions,
  entryReactions,
  entryThoughts,
  journalEntries,
} from "./schema";

export interface CreateJournalEntryParams {
  userId: number;
  content: string;
  moodId?: number | null;
  date?: Date;
  emotions?: { id: number; name: string }[];
  thoughts?: { id: number; name: string }[];
  reactions?: { id: number; name: string }[];
}

export async function createJournalEntry(params: CreateJournalEntryParams) {
  const content = params.content.trim();
  if (!content) {
    throw new Error("O conteúdo do post não pode estar vazio.");
  }

  const [entry] = await db
    .insert(journalEntries)
    .values({
      userId: params.userId,
      moodId: params.moodId ?? null,
      liked: false,
      entryType: "post",
      content,
      date: params.date ?? new Date(),
    })
    .returning();

  if (!entry) {
    throw new Error("Falha ao registrar post no banco de dados.");
  }

  if (params.emotions && params.emotions.length > 0) {
    await db.insert(entryEmotions).values(
      params.emotions.map((e) => ({
        entryId: entry.id,
        emotionId: e.id,
      }))
    );
  }

  if (params.thoughts && params.thoughts.length > 0) {
    await db.insert(entryThoughts).values(
      params.thoughts.map((t) => ({
        entryId: entry.id,
        thoughtsId: t.id,
      }))
    );
  }

  if (params.reactions && params.reactions.length > 0) {
    await db.insert(entryReactions).values(
      params.reactions.map((r) => ({
        entryId: entry.id,
        reactionId: r.id,
      }))
    );
  }

  return entry;
}
