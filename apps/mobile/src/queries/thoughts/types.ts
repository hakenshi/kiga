import type { ThoughtRepository } from "@/repositories/thought-repository";

export type ThoughtsResponse = ReturnType<typeof ThoughtRepository.search>;
export type CreateThoughtResponse = ReturnType<typeof ThoughtRepository.create>;
