import Logo from "@/components/Logo";
import { Button, ButtonGroup, ButtonText } from "@/components/ui/button";
import { FormControl, FormControlLabel, FormControlLabelText } from "@/components/ui/form-control";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { VStack } from "@/components/ui/vstack";
import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

export default function LoginPage() {
  const router = useRouter()
  const [useCloud, setUseCloud] = useState<boolean>(false)



  return (
    <FormControl className="flex-1 justify-center px-10 py-5">
      <VStack space="xl" className="flex-1 justify-center">
        <View className="items-center">
          <Logo />
        </View>
        <View>
          <FormControlLabel>
            <FormControlLabelText>
              {useCloud ? "Email" : "Nome de Usuário"}
            </FormControlLabelText>
          </FormControlLabel>
          <Input>
            <InputField placeholder={useCloud ? "email@exemplo.com" : "Insira seu nome de usuário"} />
          </Input>
        </View>
        <View>
          <FormControlLabel>
            <FormControlLabelText>
              Senha
            </FormControlLabelText>
          </FormControlLabel>
          <Input>
            <InputField placeholder="•••••••" />
          </Input>
        </View>
        <HStack className="justify-end">
          <FormControlLabel>
            <FormControlLabelText className="text-zinc-600">
              Fazer login na nuvem?
            </FormControlLabelText>
          </FormControlLabel>
          <Switch onChange={() => setUseCloud(!useCloud)} />
        </HStack>
        <View className="h-32">
          <ButtonGroup>
            <Button className="w-full" variant="default" onPress={() => router.navigate("/(home)/home")}>
              <ButtonText>
                Login
              </ButtonText>
            </Button>
          </ButtonGroup>
          <ButtonGroup className="justify-center items-center flex-1">
            <Button variant="link" className="shadow-none" onPress={() => router.navigate("/")}>
              <ButtonText>
                Home
              </ButtonText>
            </Button>
            <Button variant="link" className="shadow-none" onPress={() => router.navigate("/(auth)/register")}>
              <ButtonText>
                Cadastro
              </ButtonText>
            </Button>
          </ButtonGroup>
        </View>
      </VStack>
    </FormControl >
  )
}
