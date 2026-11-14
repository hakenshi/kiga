import { Link } from "expo-router";
import { PropsWithChildren } from "react";
import { Pressable } from "react-native";

interface Props extends PropsWithChildren {
  entryId: number;
}

export default function EntryLinkShell({ children, entryId }: Props) {

  return (
    <Link href={`/home/view-post/${entryId}`} push asChild>
      <Pressable className="border-b border-[#E6E8EC] px-4 py-4 bg-white gap-2.5 active:bg-zinc-50/70">
        {children}
      </Pressable>
    </Link>
  );
}
