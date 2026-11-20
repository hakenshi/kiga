import { NoteRepository, type NoteDateRange } from "@/repositories/note-repository";
import type {
  CreateNoteResponse,
  CreateReplyResponse,
  DeleteNoteResponse,
  NoteResponse,
  NotesResponse,
  UpdateNoteResponse,
} from "./types";

export const notesAPI = {
  getNotes: (userId: number, options: { limit: number; offset: number; dateRange?: NoteDateRange }): NotesResponse =>
    NoteRepository.findMany(userId, options),
  searchNotes: (userId: number, query: string, dateRange?: NoteDateRange): NotesResponse =>
    NoteRepository.search(query, { userId, dateRange }),
  getNote: (noteId: number): NoteResponse => NoteRepository.findOne(noteId),
  createNote: (data: NoteInsert): CreateNoteResponse => NoteRepository.create(data),
  updateNote: (noteId: number, data: NoteUpdate): UpdateNoteResponse =>
    NoteRepository.update(noteId, data),
  createReply: (noteId: number, data: NoteInsert): CreateReplyResponse =>
    NoteRepository.createReply(noteId, data),
  deleteNote: (noteId: number): Promise<DeleteNoteResponse> => NoteRepository.delete(noteId),
};
