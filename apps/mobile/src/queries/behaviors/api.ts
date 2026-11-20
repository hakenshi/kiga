import { BehaviorRepository } from "@/repositories/behavior-repository";
import type { BehaviorsResponse, DeleteBehaviorsResponse } from "./types";

export const behaviorsAPI = {
  getBehaviors: (userId: number, query: string, categoryId?: number): BehaviorsResponse =>
    BehaviorRepository.search(query, { userId, categoryId }),
  deleteBehaviors: (userId: number, ids: number[]): DeleteBehaviorsResponse =>
    BehaviorRepository.delete(ids, userId),
};
