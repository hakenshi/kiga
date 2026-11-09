import { AuthButtonBack, AuthButtonsContainer } from "@/components/auth/auth-pages-buttons";
import { AuthHeader, AuthSubtitle, AuthTitle } from "@/components/auth/auth-pages-header";
import AuthPagesShell from "@/components/auth/auth-pages-shell";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlHelper,
  FormControlHelperText,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { Input, InputField } from "@/components/ui/input";
import { VStack } from "@/components/ui/vstack";
import db from "@/lib/db";
import { users } from "@/lib/db/schema";
import { birthDateSchema, registerPinSchema } from "@/lib/db/zod/zod-schemas";
import { useAuthStore } from "@/stores/auth-store";
import { useRegisterStore } from "@/stores/register-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { Check, DeleteIcon } from "lucide-react-native";
import { Controller, useForm } from "react-hook-form";
import { HStack } from "@/components/ui/hstack";
import { View } from "react-native";

const KEYPAD_ROWS = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
  ["", 0, "backspace"],
] as const;

export default function PinPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
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
    const registerState = useRegisterStore.getState();

    if (
      !registerState.firstName ||
      !registerState.username ||
      !registerState.password ||
      !registerState.birthDate
    ) {
      router.push("/");
      return;
    }

    try {
      const [createdUser] = await db
        .insert(users)
        .values({
          firstName: registerState.firstName,
          secondName: registerState.secondName,
          username: registerState.username,
          password: registerState.password,
          birthDate: birthDateSchema.parse(registerState.birthDate),
          gender: registerState.gender,
          pronoun: registerState.pronoun,
          pin: formData.pin,
        })
        .returning();

      if (!createdUser) {
        throw new Error("Falha ao registrar usuário.");
      }

      registerState.reset();

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

      setUser({ user: sessionUser, isAuthenticated: true });

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

  // oxlint-disable-next-line react/incompatible-library
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
              <HStack space="md" className="justify-center py-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Input
                    key={i}
                    className={`h-16 w-14 rounded-2xl items-center justify-center border ${
                      field.value?.[i]
                        ? "border-foreground border-2 bg-secondary"
                        : "border-border bg-background"
                    }`}
                  >
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
                      className="h-full w-full text-center text-3xl font-bold p-0 text-foreground"
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

        {/* Teclado Numérico Responsivo (Grid 3x4 com flex-1) */}
        <VStack space="md" className="w-full max-w-[340px] self-center py-2 flex-1 justify-center">
          {KEYPAD_ROWS.map((row, rowIndex) => (
            <HStack key={rowIndex} space="md" className="w-full justify-between">
              {row.map((item, colIndex) => {
                if (item === "") {
                  return <View key={colIndex} className="flex-1" />;
                }

                if (item === "backspace") {
                  return (
                    <Button
                      key={colIndex}
                      variant="secondary"
                      rounding="2xl"
                      className="flex-1 h-14 sm:h-16 items-center justify-center border border-border active:opacity-60 active:scale-[0.95]"
                      onPress={() =>
                        setValue("pin", pin.slice(0, -1), {
                          shouldValidate: true,
                        })
                      }
                    >
                      <ButtonIcon as={DeleteIcon} size="lg" />
                    </Button>
                  );
                }

                return (
                  <Button
                    key={colIndex}
                    variant="secondary"
                    rounding="2xl"
                    className="flex-1 h-14 sm:h-16 items-center justify-center border border-border active:opacity-60 active:scale-[0.95]"
                    onPress={() => {
                      if (pin.length < 6) {
                        setValue("pin", pin + item, {
                          shouldValidate: true,
                        });
                      }
                    }}
                  >
                    <ButtonText className="text-2xl sm:text-3xl font-bold text-center text-foreground">
                      {item}
                    </ButtonText>
                  </Button>
                );
              })}
            </HStack>
          ))}
        </VStack>
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
          <ButtonIcon as={Check} size="sm" />
        </Button>
      </AuthButtonsContainer>
    </AuthPagesShell >
  );
}
