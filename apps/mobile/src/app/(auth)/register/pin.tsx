import { AuthButtonsContainer } from "@/components/auth/auth-pages-buttons";
import { AuthHeader, AuthSubtitle, AuthTitle } from "@/components/auth/auth-pages-header";
import AuthPagesShell from "@/components/auth/auth-pages-shell";
import { Button, ButtonText } from "@/components/ui/button";
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
import { registerPinSchema } from "@/lib/db/zod/zod-schemas";
import { useAuthStore } from "@/stores/auth-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { deleteItemAsync, getItem, setItemAsync } from "expo-secure-store";
import { Check, KeyRound } from "lucide-react-native";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

export default function PinPage() {
  const router = useRouter();
  const authStore = useAuthStore();

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterPinSchema>({
    resolver: zodResolver(registerPinSchema),
    defaultValues: {
      pin: "",
    },
  });

  useEffect(() => {
    const checkExpiration = async () => {
      const keys = ["register-name", "register-security", "register-identity"] as const;
      const now = Date.now();
      let hasExpired = false;

      for (const key of keys) {
        const item = getItem(key);
        if (item) {
          try {
            const parsed = JSON.parse(item);
            if (typeof parsed.expiresAt === "number" && now > parsed.expiresAt) {
              await deleteItemAsync(key);
              hasExpired = true;
            }
          } catch {
            await deleteItemAsync(key);
            hasExpired = true;
          }
        }
      }

      if (hasExpired) {
        reset({ pin: "" });
        setError("pin", {
          type: "manual",
          message: "O tempo de cadastro expirou. Por favor, reinicie o processo.",
        });
      }
    };

    checkExpiration();
  }, [reset, setError]);

  const submit = async (formData: RegisterPinSchema) => {
    const nameRaw = getItem("register-name");
    const securityRaw = getItem("register-security");
    const identityRaw = getItem("register-identity");

    if (!nameRaw || !securityRaw || !identityRaw) {
      setError("pin", {
        type: "manual",
        message: "Dados de etapas anteriores incompletos. Reinicie o cadastro.",
      });
      return;
    }

    try {
      const nameData = JSON.parse(nameRaw).data;
      const securityData = JSON.parse(securityRaw).data;
      const identityData = JSON.parse(identityRaw).data;

      const [createdUser] = await db
        .insert(users)
        .values({
          firstName: nameData.firstName,
          secondName: nameData.secondName,
          username: nameData.username,
          password: securityData.password,
          birthDate: new Date(nameData.birthDate ?? securityData.birthDate),
          gender: identityData.gender,
          pronoun: identityData.pronoun,
          pin: formData.pin,
        })
        .returning();

      if (!createdUser) {
        throw new Error("Falha ao registrar usuário.");
      }

      await deleteItemAsync("register-name");
      await deleteItemAsync("register-security");
      await deleteItemAsync("register-identity");

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

  return (
    <AuthPagesShell>
      <AuthHeader>
        <AuthTitle>Código de Segurança</AuthTitle>
        <AuthSubtitle>
          Crie um PIN de 4 a 6 dígitos para proteger sua conta
        </AuthSubtitle>
      </AuthHeader>
      <VStack className="flex-1 pt-10" space="lg">
        <Controller
          name="pin"
          control={control}
          render={({ field }) => (
            <FormControl isRequired isInvalid={Boolean(errors.pin)}>
              <FormControlLabel>
                <FormControlLabelText>PIN</FormControlLabelText>
              </FormControlLabel>
              <Input>
                <InputSlot>
                  <InputIcon as={KeyRound} />
                </InputSlot>
                <InputField
                  testID="register-pin-input"
                  keyboardType="numeric"
                  maxLength={6}
                  type="password"
                  onChangeText={field.onChange}
                  value={field.value}
                  onBlur={field.onBlur}
                  placeholder="••••"
                />
              </Input>
              <FormControlHelper>
                <FormControlHelperText>
                  O PIN deve conter de 4 a 6 números.
                </FormControlHelperText>
              </FormControlHelper>
              <FormControlError>
                <FormControlErrorText>{errors.pin?.message}</FormControlErrorText>
              </FormControlError>
            </FormControl>
          )}
        />
      </VStack>

      <AuthButtonsContainer>
        <Button
          testID="register-pin-submit-button"
          className="w-full flex-row items-center justify-center gap-2"
          disabled={isSubmitting}
          onPress={handleSubmit(submit)}
        >
          <ButtonText>Concluir Cadastro</ButtonText>
          <Check color="white" size={16} />
        </Button>
      </AuthButtonsContainer>
    </AuthPagesShell>
  );
}
