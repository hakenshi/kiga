import { useRouter } from "expo-router";
import { X } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { PropsWithChildren } from "react";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";


export default function ComposerHeader({ children }: PropsWithChildren) {
  const router = useRouter();
  const { top } = useSafeAreaInsets();

  return (
    <VStack style={{ paddingTop: top }} className="bg-white border-b border-gray-100">
      <HStack className="px-4 h-14 justify-between items-center">
        {children}
      </HStack>
    </VStack>
  );
}
