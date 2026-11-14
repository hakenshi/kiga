import { PropsWithChildren } from "react";
import { Pressable } from "react-native";

export default function EntryShell({ children }: PropsWithChildren) {
  return (
    <Pressable className="border-b border-[#E6E8EC] px-4 py-4 bg-white gap-2.5 active:bg-zinc-50/70" >
      {children}
    </Pressable >
  );
}
