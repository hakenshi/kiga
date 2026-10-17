import { Button, ButtonText } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { LogInIcon, UserPlus } from "lucide-react-native";
import { Image } from "expo-image";

export default function Index() {
  const router = useRouter();

  return (
    <VStack className="flex-1 justify-center items-center px-5 py-20">
      <View className="flex-1 justify-center items-center gap-4">
        <Image
          source={require("../../assets/images/kiga-logo.jpg")}
          style={{ width: 160, height: 160, borderRadius: 20 }}
          contentFit="contain"
        />
        <Text className="text-2xl text-center">
          Bem-vindo ao Kiga!
        </Text>
        <Text className="text-lg text-zinc-800">
          Como você está se sentindo hoje?
        </Text>
      </View>
      <View className="w-full flex-1 justify-start gap-3">
        <Button className="w-full">
          <ButtonText>
            Fazer login com o Google
          </ButtonText>
        </Button>

        <View className="flex-row w-full gap-2">
          <Button
            className="flex-1 justify-center"
            onPress={() => router.navigate("/(auth)/register")}
          >
            <UserPlus color="white" size={16} />
            <ButtonText>
              Criar Conta
            </ButtonText>
          </Button>
          <Button
            className="flex-1 justify-center"
            onPress={() => router.navigate("/(auth)/login")}
          >
            <LogInIcon color="white" size={16} />
            <ButtonText>
              Fazer Login
            </ButtonText>
          </Button>
        </View>
      </View>
    </VStack>
  );
}
