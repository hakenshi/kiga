import { Stack, useRouter } from "expo-router";
import { VStack } from "@/components/ui/vstack";
import { Button, ButtonGroup } from "@/components/ui/button";
import { HomeIcon } from "lucide-react-native";

export default function RegisterLayout() {
  const router = useRouter()
  return (
    <VStack className="flex-1 pt-14">
      <ButtonGroup className="p-4">
        <Button onPress={() => router.push("/")} size="md">
          <HomeIcon color="white" size={16} />
        </Button>
      </ButtonGroup>
      <Stack screenOptions={{ headerShown: false }} />
    </VStack >
  );
}
