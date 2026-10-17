import Logo from "@/components/Logo";
import { Button, ButtonGroup, ButtonText } from "@/components/ui/button";
import { FormControl, FormControlHelper, FormControlHelperText, FormControlLabel, FormControlLabelText } from "@/components/ui/form-control";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { VStack } from "@/components/ui/vstack";
import { useRouter } from "expo-router";
import { View } from "react-native";
import { useFormStep } from "./FormStepContext";

const STEPS = [
  RegisterFormUserName,
  RegisterFormUserThingy,
  RegisterUserFormPin,
]


function WizardButtons() {
  const { currentFormStep, decreaseFormStep, increaseFormStep } = useFormStep()
  const canIncreaseFormStep = currentFormStep != STEPS.length
  const canDecreaseFormStep = currentFormStep != 1
  return (
    <ButtonGroup>
      {canDecreaseFormStep &&
        < Button onPress={() => decreaseFormStep()} className={canIncreaseFormStep && canDecreaseFormStep ? "w-1/2" : "w-full"} variant="default">
          <ButtonText>
            Voltar
          </ButtonText>
        </Button>
      }
      {
        canIncreaseFormStep &&
        <Button onPress={() => increaseFormStep()} className={canIncreaseFormStep && canDecreaseFormStep ? "w-1/2" : "w-full"} variant="default">
          <ButtonText>
            Continuar
          </ButtonText>
        </Button>
      }
    </ButtonGroup >
  )
}
function RegisterUserFormPin() {
  const { decreaseFormStep } = useFormStep()
  return (
    <FormControl className="flex-1 justify-start px-10 py-5" >
      <VStack space="xl" className="justify-center">
        <View>
          <FormControlLabel>
            <FormControlLabelText>
              Pin
            </FormControlLabelText>
          </FormControlLabel>
          <Input>
            <InputField placeholder="•••••••" />
          </Input>
          <FormControlHelper>
            <FormControlHelperText>
              Crie um pin para manter seus dados seguros
            </FormControlHelperText>
          </FormControlHelper>
        </View>
        <HStack>
          <ButtonGroup className="justify-center">
            <Button className="w-1/2" onPress={() => decreaseFormStep()}>
              <ButtonText>
                Voltar
              </ButtonText>
            </Button>
            <Button className="w-1/2">
              <ButtonText>Cadastrar</ButtonText>
            </Button>
          </ButtonGroup>
        </HStack>
      </VStack>
    </FormControl >
  )
}
function RegisterFormUserThingy() {

  return (
    <FormControl className="flex-1 justify-start px-10 py-5" >
      <VStack space="xl" className="justify-center">
        <View>
          <FormControlLabel>
            <FormControlLabelText>
              Data de nascimento
            </FormControlLabelText>
          </FormControlLabel>
          <Input>
            <InputField placeholder={"xx/xx/xxxx"} />
          </Input>
        </View>
        <View>
          <FormControlLabel>
            <FormControlLabelText>
              Gênero
            </FormControlLabelText>
          </FormControlLabel>
          <Input>
            <InputField placeholder="•••••••" />
          </Input>
        </View>
        <View>
          <FormControlLabel>
            <FormControlLabelText>
              Pronome
            </FormControlLabelText>
          </FormControlLabel>
          <Input>
            <InputField placeholder="•••••••" />
          </Input>
        </View>
        <WizardButtons />
      </VStack>
    </FormControl >
  )
}

function RegisterFormUserName() {
  return (
    <FormControl className="flex-1 justify-start px-10 py-5" >
      <VStack space="xl" className="justify-center">
        <View>
          <FormControlLabel>
            <FormControlLabelText>
              Nome de Usuário
            </FormControlLabelText>
          </FormControlLabel>
          <Input>
            <InputField placeholder={"Insira seu nome de usuário"} />
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
        <View>
          <FormControlLabel>
            <FormControlLabelText>
              Confirmar Senha
            </FormControlLabelText>
          </FormControlLabel>
          <Input>
            <InputField placeholder="•••••••" />
          </Input>
        </View>
        <WizardButtons />
      </VStack>
    </FormControl >
  )
}

export default function RegisterPage() {
  const { currentFormStep } = useFormStep()
  const CurrentStepComponent = STEPS[currentFormStep - 1]
  if (!CurrentStepComponent) {
    return null
  }
  const router = useRouter()
  return (
    <>
      <View className="h-1/3 justify-end items-center mb-10">
        <Logo />
      </View>
      <CurrentStepComponent />
      <ButtonGroup className="justify-center items-center flex-1">
        <Button variant="link" className="shadow-none" onPress={() => router.navigate("/")}>
          <ButtonText>
            Home
          </ButtonText>
        </Button>
        <Button variant="link" className="shadow-none" onPress={() => router.navigate("/(auth)/login")}>
          <ButtonText>
            Login
          </ButtonText>
        </Button>
      </ButtonGroup>
    </>
  )
}
