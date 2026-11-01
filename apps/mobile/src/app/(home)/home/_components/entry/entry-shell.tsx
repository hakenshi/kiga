import { VStack } from "@/components/ui/vstack";
import { PropsWithChildren } from "react";

interface Props extends PropsWithChildren {
  entryId: number
}

export default function EntryShell({ children }: Props) {
  return (
    <VStack className="border-gray-300 border-t p-5 bg-white">
      {children}
    </VStack >
  )
}
