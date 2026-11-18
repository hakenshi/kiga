import { useNoteStore } from "@/stores/note-store";
import { Link } from "expo-router";
import { PropsWithChildren } from "react";
import { Pressable } from "react-native";
import NoteContextProvider from "./note-context";

interface Props extends PropsWithChildren {
  note: Note
}

export default function NoteLinkShell({ children, note }: Props) {
  const setViewNote = useNoteStore(s => s.setViewNote)

  return (
    <NoteContextProvider note={note}>

      <Link onPress={() => setViewNote(note)} href="/home/view-note"
        push
        asChild>
        <Pressable className="border-b border-[#E6E8EC] px-4 py-4 bg-white gap-2.5 active:bg-zinc-50/70">
          {children}
        </Pressable>
      </Link>
    </NoteContextProvider >
  );
}
