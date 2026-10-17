import Logo from "@/components/Logo";
import { Button, ButtonGroup, ButtonText } from "@/components/ui/button";
import { FormControl, FormControlHelper, FormControlHelperText, FormControlLabel, FormControlLabelText } from "@/components/ui/form-control";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { VStack } from "@/components/ui/vstack";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

export default function LoginPage() {
  const router = useRouter()
  const [useCloud, setUseCloud] = useState<boolean>(false)



  return (
    <FormControl className="flex-1 justify-center px-10 py-5">
      <VStack space="xl" className="justify-center">
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
              Acessar a nuvem?
            </FormControlLabelText>
          </FormControlLabel>
          <Switch onChange={() => setUseCloud(!useCloud)} />
        </HStack>
        <ButtonGroup>
          <Button className="w-full" variant="default" onPress={() => router.navigate("/")}>
            <ButtonText>
              Login
            </ButtonText>
          </Button>
        </ButtonGroup>
      </VStack>
    </FormControl >
  )
}
