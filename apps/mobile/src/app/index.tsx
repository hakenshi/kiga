import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { Redirect, useRouter } from "expo-router";
import { Text } from "@/components/ui/text";
import Logo from "@/components/Logo";
import { useAuthStore } from "@/stores/auth-store";
import { HStack } from "@/components/ui/hstack";
import { ArrowRightIcon, UserIcon } from "lucide-react-native";

export default function Index() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Redirect href="/home" />;
  }

  return (
    <VStack className="flex-1 justify-center items-center px-5 py-20 bg-background">
      <VStack className="flex-1 justify-center items-center gap-4">
        <Logo size="xl" />
        <Text className="text-2xl text-center font-heading text-foreground">
          Bem-vindo ao Kiga!
        </Text>
        <Text className="text-lg text-muted-foreground text-center font-subtitle">
          Seu diário privado para registrar pensamentos, emoções e humor.
        </Text>
        <Text className="text-lg text-muted-foreground text-center font-subtitle">
          100% offline
        </Text>
      </VStack>
      <VStack space="md" className="w-full justify-end">
        <Button onPress={() => router.push("/(auth)/register")}>
          <ButtonIcon as={UserIcon} size="md" />
          <ButtonText>
            Começar agora - Criar Conta
          </ButtonText>
        </Button>
        <Button variant="secondary">
          <ButtonText>
            Fazer login com o Google
          </ButtonText>
        </Button>
        <HStack className="items-center justify-center pt-8 gap-1">
          <Text className="text-muted-foreground text-sm">
            Já possui uma conta?
          </Text>
          <Button variant="ghost" className="shadow-none" onPress={() => router.push("/(auth)/login")}>
            <ButtonText className="font-bold">
              Fazer Login
            </ButtonText>
            <ButtonIcon as={ArrowRightIcon} size="sm" />
          </Button>
        </HStack>
      </VStack>
    </VStack >
  );
}
