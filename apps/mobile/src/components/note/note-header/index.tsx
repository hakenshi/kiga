import { HStack } from "@/components/ui/hstack";
import { PropsWithChildren } from "react";

export default function NoteHeader({ children }: PropsWithChildren) {
  return (
    <HStack className="justify-between items-start" space="md">
      {children}
    </HStack>
  )
}
