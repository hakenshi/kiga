import { AuthButtonBack, AuthButtonsContainer } from "@/components/auth/auth-pages-buttons";
import { AuthHeader, AuthSubtitle, AuthTitle } from "@/components/auth/auth-pages-header";
import AuthPagesShell from "@/components/auth/auth-pages-shell";
import { Button, ButtonGroup, ButtonText } from "@/components/ui/button";
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlHelper,
  FormControlHelperText,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { VStack } from "@/components/ui/vstack";
import db from "@/lib/db";
import { users } from "@/lib/db/schema";
import { birthDateSchema, registerPinSchema } from "@/lib/db/zod/zod-schemas";
import { clearRegisterStorage, getStoredItem } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { setItemAsync } from "expo-secure-store";
import { Check, DeleteIcon, KeyRound } from "lucide-react-native";
import { Controller, useForm } from "react-hook-form";
import { RegisterNameData } from "./index";
import { View } from "react-native";
import { HStack } from "@/components/ui/hstack";

export default function PinPage() {
  const router = useRouter();
  const authStore = useAuthStore();
  const {
    control,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterPinSchema>({
    resolver: zodResolver(registerPinSchema),
    defaultValues: {
      pin: "",
    },
  });

  const submit = async (formData: RegisterPinSchema) => {
    const nameData = getStoredItem<RegisterNameData>("register-name");
    const securityData =
      getStoredItem<RegisterSecuritySchema>("register-security");
    const identityData =
      getStoredItem<RegisterIdentitySchema>("register-identity");

    if (!nameData || !securityData || !identityData) {
      router.push("/")
      return;
    }

    try {
      const [createdUser] = await db
        .insert(users)
        .values({
          firstName: nameData.firstName,
          secondName: nameData.secondName,
          username: nameData.username,
          password: securityData.password,
          birthDate: birthDateSchema.parse(nameData.birthDate),
          gender: identityData.gender,
          pronoun: identityData.pronoun,
          pin: formData.pin,
        })
        .returning();

      if (!createdUser) {
        throw new Error("Falha ao registrar usuário.");
      }

      await clearRegisterStorage();

      const sessionUser: User = {
        id: createdUser.id,
        firstName: createdUser.firstName,
        secondName: createdUser.secondName,
        username: createdUser.username,
        birthDate: createdUser.birthDate,
        gender: createdUser.gender,
        pronoun: createdUser.pronoun,
        createdAt: createdUser.createdAt,
      };

      await setItemAsync(
        "session",
        JSON.stringify({ ...sessionUser, isAuthenticated: true })
      );

      authStore.setUser({ user: sessionUser, isAuthenticated: true });

      router.replace("/home");
    } catch (err: unknown) {
      console.error("Erro ao cadastrar usuário:", err);
      setError("pin", {
        type: "manual",
        message:
          err instanceof Error
            ? err.message
            : "Ocorreu um erro ao finalizar o cadastro.",
      });
    }
  };

  const pin = watch("pin") || ""

  return (
    <AuthPagesShell>
      <VStack className="flex-1" space="lg">

        <AuthHeader>
          <AuthTitle>Código de Segurança</AuthTitle>
          <AuthSubtitle>
            Crie um PIN de 4 a 6 dígitos para proteger sua conta
          </AuthSubtitle>
        </AuthHeader>
        <Controller
          name="pin"
          control={control}
          render={({ field }) => (
            <FormControl isRequired isInvalid={Boolean(errors.pin)} className="">
              <FormControlLabel>
                <FormControlLabelText>PIN</FormControlLabelText>
              </FormControlLabel>
              <HStack space="md" className="justify-center py-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Input key={i} className="w-1/5">
                    <InputField
                      testID="register-pin-input"
                      keyboardType="numeric"
                      maxLength={6}
                      type="password"
                      onChangeText={field.onChange}
                      value={field.value?.[i] ?? ""}
                      onBlur={field.onBlur}
                      editable={false}
                      style={{ textAlign: "center" }}
                      className="h-20 px-5 text-4xl"
                    />
                  </Input>
                ))}
              </HStack>
              <FormControlHelper>
                <FormControlHelperText>
                  O PIN deve conter 4 números.
                </FormControlHelperText>
              </FormControlHelper>
              <FormControlError>
                <FormControlErrorText>{errors.pin?.message}</FormControlErrorText>
              </FormControlError>
            </FormControl>
          )}
        />
        <ButtonGroup className="flex-1 flex-wrap justify-center items-center py-5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0].map((item, i) => (
            <Button key={i} className="w-32 h-20" variant="secondary" onPress={() => {
              if (item !== "") {
                setValue("pin", pin + item, { shouldValidate: true })
              }
            }}>
              <ButtonText className="text-4xl text-center">
                {item}
              </ButtonText>
            </Button>
          ))}
          <Button className="w-32 h-20" onPress={() => setValue("pin", pin.slice(0, -1), { shouldValidate: true })}>
            <DeleteIcon key={20} color="white" />
          </Button>
        </ButtonGroup>
      </VStack>
      <AuthButtonsContainer>
        <AuthButtonBack variant="half">
          Voltar
        </AuthButtonBack>
        <Button
          testID="register-pin-submit-button"
          className="w-1/2 flex-row items-center justify-center gap-2"
          disabled={isSubmitting}
          onPress={handleSubmit(submit)}
        >
          <ButtonText>Concluir Cadastro</ButtonText>
          <Check color="white" size={16} />
        </Button>
      </AuthButtonsContainer>
    </AuthPagesShell >
  );
}
