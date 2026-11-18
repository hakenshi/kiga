import { VStack } from "@/components/ui/vstack";
import { PropsWithChildren } from "react";
import { View } from "react-native";

export default function NoteTagsShell({ children }: PropsWithChildren) {
  return (
    <VStack className="gap-2 pt-0.5">
      <View className="flex-row flex-wrap items-center gap-1.5 pt-0.5">
        {children}
      </View>
    </VStack>
  )
}
