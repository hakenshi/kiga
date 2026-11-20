import { EmotionRepository } from "@/repositories/emotion-repository";
import type { DeleteEmotionsResponse, EmotionsResponse } from "./types";

export const emotionsAPI = {
  getEmotions: (userId: number, query: string, categoryId?: number): EmotionsResponse =>
    EmotionRepository.search(query, { userId, categoryId }),
  deleteEmotions: (userId: number, ids: number[]): DeleteEmotionsResponse =>
    EmotionRepository.delete(ids, userId),
};
