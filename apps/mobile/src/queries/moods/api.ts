import { MoodRepository } from "@/repositories/mood-repository";
import type { MoodsResponse } from "./types";

export const moodsAPI = {
  getMoods: (userId: number, query: string): MoodsResponse =>
    MoodRepository.search(query, { userId }),
};
