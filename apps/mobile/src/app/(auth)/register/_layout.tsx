import { Stack, usePathname } from "expo-router";
import { VStack } from "@/components/ui/vstack";
import { View } from "react-native";
import { Progress, ProgressFilledTrack } from "@/components/ui/progress";

const PATH_PERCENTAGE = {
  "/register": 25,
  "/register/security": 50,
  "/register/identity": 75,
  "/register/pin": 100,

}

export default function RegisterLayout() {
  const pathName = usePathname()

  return (
    <VStack className="flex-1 pt-14">
      <View className="w-full p-5">
        <Progress orientation="horizontal" value={PATH_PERCENTAGE[pathName as keyof typeof PATH_PERCENTAGE]} className="bg-secondary">
          <ProgressFilledTrack className="rounded-full bg-primary" />
        </Progress>
      </View>
      <Stack screenOptions={{ headerShown: false, animation: "none" }} />
    </VStack >
  );
}
