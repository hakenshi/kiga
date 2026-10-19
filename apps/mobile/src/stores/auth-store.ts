import { User } from "@/lib/db/zod-schemas"
import { create } from "zustand"


type State = {
  user?: User
}
type Actions = {
  updateAuth: (user: State['user']) => void
}
export const useAuthStore = create<State & Actions>((set) => ({
  user: undefined,
  updateAuth: (user: State["user"]) => set(() => ({ user: user })),
}))
