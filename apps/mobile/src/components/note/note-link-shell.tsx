import { Link } from "expo-router";
import { PropsWithChildren } from "react";
import { Pressable } from "react-native";
import NoteContextProvider from "./note-context";

interface Props extends PropsWithChildren {
  note: Note
}

export default function NoteLinkShell({ children, note }: Props) {

  return (
    <NoteContextProvider note={note}>

      <Link href={{ pathname: "/home/view-note", params: { noteId: note.id } }}
        push
        asChild>
        <Pressable className="border-b border-gray-200 px-4 py-4 bg-white gap-2.5 active:bg-zinc-50/70">
          {children}
        </Pressable>
      </Link>
    </NoteContextProvider >
  );
}
