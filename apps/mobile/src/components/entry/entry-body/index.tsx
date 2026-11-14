import { VStack } from "@/components/ui/vstack";
import { PropsWithChildren } from "react";
export default function EntryBodyShell({ children }: PropsWithChildren) {
  return (
    <VStack className="pt-0.5 pb-1" space="md">
      {children}
    </VStack>
  );
}
