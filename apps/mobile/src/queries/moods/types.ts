import type { MoodRepository } from "@/repositories/mood-repository";

export type MoodsResponse = ReturnType<typeof MoodRepository.search>;
