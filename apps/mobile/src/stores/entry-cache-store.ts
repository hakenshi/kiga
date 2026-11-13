import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import Storage from "expo-sqlite/kv-store"
import { journalEntryUpdateSchema } from "@/lib/db/zod/schemas/entry/index.schema"
import z from "zod"

const stateSchema = journalEntryUpdateSchema.extend({
  expired: z.boolean(),
  expiresIn: z.number(),
})

const updateStateSchema = stateSchema.partial()

type State = z.infer<typeof stateSchema>
type InputState = z.infer<typeof updateStateSchema>

interface Actions {
  updateCachedEntry: (entryData: InputState) => void
  clearCachedEntry: () => void
}

const initialState: State = {
  expired: true,
  // Expires in X seconds, 0 by default.
  expiresIn: 0,
  content: "",
  entryType: "post",
  date: undefined,
  entryBehaviors: [],
  entryEmotions: [],
  entryImages: [],
  entryReactions: [],
  entryThoughts: [],
  fixed: false,
  liked: false,
  moodId: undefined,
  userId: undefined
}

export const useEntryCacheStore = create<State & Actions>()(
  persist(
    (set,) => ({
      ...initialState,
      updateCachedEntry: (entryData) => set((e) => ({ ...e, ...entryData, expired: false, expiresIn: 900 })),
      clearCachedEntry: () => set(() => ({
        ...initialState
      }))
    }),
    {
      name: "entryCache",
      storage: createJSONStorage(() => Storage)
    }
  )

)
