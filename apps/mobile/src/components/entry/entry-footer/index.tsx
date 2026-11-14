import { HStack } from "@/components/ui/hstack";
import { PropsWithChildren } from "react";

export default function EntryFooterShell({ children }: PropsWithChildren) {
  return (
    <HStack className="justify-between items-center pt-1">
      {children}
    </HStack>
  );
}
