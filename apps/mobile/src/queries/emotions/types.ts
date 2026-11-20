import type { EmotionRepository } from "@/repositories/emotion-repository";

export type EmotionsResponse = ReturnType<typeof EmotionRepository.search>;
export type DeleteEmotionsResponse = ReturnType<typeof EmotionRepository.delete>;
