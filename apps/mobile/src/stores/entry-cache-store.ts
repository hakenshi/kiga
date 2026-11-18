import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import Storage from "expo-sqlite/kv-store"
import { noteUpdateSchema } from "@/lib/db/zod/schemas/note/index.schema"
import z from "zod"
import { useAuthStore } from "./auth-store"

const stateSchema = z.object({
  expired: z.boolean(),
  expiresIn: z.number(),
  entry: noteUpdateSchema,
})

type State = z.infer<typeof stateSchema>
type InputState = z.infer<typeof noteUpdateSchema>

interface Actions {
  updateCachedEntry: (entryData: InputState) => void
  clearCachedEntry: () => void
  tickExpiration: () => void
}

const initialState: State = {
  expired: true,
  // Expires in X seconds, 0 by default.
  expiresIn: 0,
  entry: {
    userId: useAuthStore.getState().user?.id
  }
}

export const useEntryCacheStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...initialState,
      updateCachedEntry: (entryData) => set((e) => ({
        entry: { ...e.entry, ...entryData },
        expired: false,
        expiresIn: 900,
      })),
      clearCachedEntry: () => set(() => ({
        ...initialState
      })),
      tickExpiration: () => {
        const { expired, expiresIn, clearCachedEntry } = get()
        if (expired) return
        if (expiresIn <= 1) {
          clearCachedEntry()
          return
        }
        set({ expiresIn: expiresIn - 1 })
      }
    }),
    {
      name: "entryCache",
      storage: createJSONStorage(() => Storage)
    }
  )

)
