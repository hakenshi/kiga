import Logo from "@/components/common/logo";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAuthStore } from "@/stores/auth-store";
import { Link, Redirect } from "expo-router";
import { ArrowRightIcon, UserIcon } from "lucide-react-native";

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

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
        <Link href="/(auth)/register" push asChild>
          <Button>
            <ButtonIcon as={UserIcon} size="md" />
            <ButtonText>
              Começar agora - Criar Conta
            </ButtonText>
          </Button>
        </Link>
        <HStack className="items-center justify-center pt-8 gap-1">
          <Text className="text-muted-foreground text-sm">
            Já possui uma conta?
          </Text>
          <Link href="/(auth)/login" push asChild>
            <Button variant="ghost" className="shadow-none">
              <ButtonText className="font-bold">
                Fazer Login
              </ButtonText>
              <ButtonIcon as={ArrowRightIcon} size="sm" />
            </Button>
          </Link>
        </HStack>
      </VStack>
    </VStack >
  );
}
