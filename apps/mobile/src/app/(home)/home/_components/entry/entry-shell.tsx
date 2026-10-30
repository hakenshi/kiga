import { VStack } from "@/components/ui/vstack";
import { PropsWithChildren } from "react";

export default function EntryShell({ children }: PropsWithChildren) {
  return (
    <VStack className="border-gray-300 border-t border-b p-5 bg-white">
      {children}
    </VStack >
  )
}
