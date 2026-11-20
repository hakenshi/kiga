import { ThoughtRepository } from "@/repositories/thought-repository";
import type { CreateThoughtResponse, ThoughtsResponse } from "./types";

export const thoughtsAPI = {
  getThoughts: (userId: number, query: string): ThoughtsResponse =>
    ThoughtRepository.search(query, { userId }),
  createThought: (userId: number, data: ThoughtInsert): CreateThoughtResponse =>
    ThoughtRepository.create({ ...data, userId }),
};
