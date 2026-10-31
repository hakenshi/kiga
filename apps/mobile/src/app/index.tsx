import { Button, ButtonText } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { Redirect, useRouter } from "expo-router";
import { Text } from "react-native";
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
    <VStack className="flex-1 justify-center items-center px-5 py-20">
      <VStack className="flex-1 justify-center items-center gap-4">
        <Logo size="xl" />
        <Text className="text-2xl text-center font-heading">
          Bem-vindo ao Kiga!
        </Text>
        <Text className="text-lg text-zinc-600 text-center font-subtitle">
          Seu diário privado para registrar pensamentos, emoções e humor.
        </Text>
        <Text className="text-lg text-zinc-600 text-center font-subtitle">
          100% offline
        </Text>
      </VStack>
      <VStack space="md" className="w-full justify-end">
        <Button onPress={() => router.push("/(auth)/register")}>
          <UserIcon size={16} color="white" />
          <ButtonText>
            Começar agora - Criar Conta
          </ButtonText>
        </Button>
        <Button variant="secondary">
          <ButtonText>
            Fazer login com o Google
          </ButtonText>
        </Button>
        <HStack className="items-center justify-center pt-8">
          <Text>
            Já possui uma conta?
          </Text>
          <Button variant="ghost" className="shadow-none" onPress={() => router.push("/(auth)/login")}>
            <ButtonText className="font-bold">
              Fazer Login
            </ButtonText>
            <ArrowRightIcon size={16} />
          </Button>
        </HStack>
      </VStack>
    </VStack >
  );
}
