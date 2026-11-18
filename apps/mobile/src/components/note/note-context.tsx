import { createContext, PropsWithChildren, useContext } from "react";


interface NoteContextProps extends PropsWithChildren {
  note: Note
}
const NoteContext = createContext<NoteContextProps | null>(null)

export function useNote() {
  const context = useContext(NoteContext)
  if (!context) {
    throw new Error("hook context was use ouside of the hook context.")
  }

  return context
}
export default function NoteContextProvider({ note, children }: NoteContextProps) {
  return (
    <NoteContext value={{ note }}>
      {children}
    </NoteContext>
  )
}

