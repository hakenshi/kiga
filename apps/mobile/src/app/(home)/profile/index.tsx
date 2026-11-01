import { ScrollView } from "react-native";
import { Text } from "@/components/ui/text";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { Avatar, AvatarFallback, AvatarFallbackText, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/auth-store";
import { LogOut } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const { top } = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingTop: top + 16, paddingBottom: 96, paddingHorizontal: 20 }}
    >
      <VStack space="xl">
        {/* Card do Usuário */}
        <VStack className="bg-secondary/40 border border-border rounded-3xl p-5 items-center gap-3">
          <Avatar className="w-20 h-20">
            <AvatarImage />
            <AvatarFallback>
              <AvatarFallbackText className="text-2xl font-bold">
                {user?.firstName?.[0] ?? "U"}
              </AvatarFallbackText>
            </AvatarFallback>
          </Avatar>
          <VStack className="items-center">
            <Text className="text-xl font-heading text-foreground">
              {user?.firstName} {user?.secondName}
            </Text>
            <Text className="text-sm font-subtitle text-muted-foreground">
              @{user?.username}
            </Text>
          </VStack>
        </VStack>

        {/* Ações de Conta */}
        <VStack space="md" className="pt-4">
          <Button
            variant="destructive"
            onPress={logout}
            className="w-full flex-row items-center justify-center gap-2"
          >
            <ButtonIcon as={LogOut} size="sm" />
            <ButtonText>Sair da Conta</ButtonText>
          </Button>
        </VStack>
      </VStack>
    </ScrollView>
  );
}
