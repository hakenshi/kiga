import type { BehaviorRepository } from "@/repositories/behavior-repository";

export type BehaviorsResponse = ReturnType<typeof BehaviorRepository.search>;
export type DeleteBehaviorsResponse = ReturnType<typeof BehaviorRepository.delete>;
