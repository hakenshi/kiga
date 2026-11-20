import type { ReactionRepository } from "@/repositories/reaction-repository";

export type ReactionsResponse = ReturnType<typeof ReactionRepository.search>;
export type DeleteReactionsResponse = ReturnType<typeof ReactionRepository.delete>;
