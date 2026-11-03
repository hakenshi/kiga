import { VStack } from "@/components/ui/vstack";
import { PropsWithChildren } from "react";

interface Props extends PropsWithChildren {
  entryId: number;
}

export default function EntryShell({ children }: Props) {
  return (
    <VStack className="border-b border-[#E6E8EC] px-4 py-4 bg-white gap-2.5">
      {children}
    </VStack>
  );
}
