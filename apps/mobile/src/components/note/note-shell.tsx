import { PropsWithChildren } from "react";
import { Pressable } from "react-native";
import NoteContextProvider from "./note-context";

interface Props extends PropsWithChildren {
  note: Note
}
export default function NoteShell({ note, children }: Props) {
  return (
    <NoteContextProvider note={note}>
      <Pressable className="border-b border-[#E6E8EC] px-4 py-4 bg-white gap-2.5 active:bg-zinc-50/70" >
        {children}
      </Pressable >

    </NoteContextProvider>
  );
}
