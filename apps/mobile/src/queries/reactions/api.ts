import { ReactionRepository } from "@/repositories/reaction-repository";
import type { DeleteReactionsResponse, ReactionsResponse } from "./types";

export const reactionsAPI = {
  getReactions: (userId: number, query: string, categoryId?: number): ReactionsResponse =>
    ReactionRepository.search(query, { userId, categoryId }),
  deleteReactions: (userId: number, ids: number[]): DeleteReactionsResponse =>
    ReactionRepository.delete(ids, userId),
};
