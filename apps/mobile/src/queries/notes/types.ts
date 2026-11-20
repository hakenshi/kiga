import type { NoteRepository } from "@/repositories/note-repository";

export type NotesResponse = ReturnType<typeof NoteRepository.findMany>;
export type NoteResponse = ReturnType<typeof NoteRepository.findOne>;
export type CreateNoteResponse = ReturnType<typeof NoteRepository.create>;
export type UpdateNoteResponse = ReturnType<typeof NoteRepository.update>;
export type CreateReplyResponse = ReturnType<typeof NoteRepository.createReply>;
export type DeleteNoteResponse = Awaited<ReturnType<typeof NoteRepository.delete>>;
