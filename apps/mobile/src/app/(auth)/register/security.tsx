import { AuthButtonBack, AuthButtonNext, AuthButtonsContainer } from "@/components/auth/auth-pages-buttons";
import { AuthHeader, AuthSubtitle, AuthTitle } from "@/components/auth/auth-pages-header";
import AuthPagesShell from "@/components/auth/auth-pages-shell";
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { VStack } from "@/components/ui/vstack";
import { registerSecuritySchema } from "@/lib/db/zod/zod-schemas";
import { createTimestamps, isExpired } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { deleteItemAsync, getItem, setItemAsync } from "expo-secure-store";
import { Eye, EyeOff, KeyRound, Lock } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

type RegisterSecurityStore = {
  data: {
    password: string;
    confirmPassword: string;
  };
  updatedAt: number;
  expiresAt: number;
};

export default function SecurityPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const registerSecurity = getItem("register-security");
  const registerSecurityData: RegisterSecurityStore | null = (() => {
    if (!registerSecurity) return null;
    try {
      const parsed: RegisterSecurityStore = JSON.parse(registerSecurity);
      if (isExpired(parsed.expiresAt)) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  })();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegisterSecurityInput, any, RegisterSecuritySchema>({
    resolver: zodResolver(registerSecuritySchema),
    defaultValues: {
      password: registerSecurityData ? registerSecurityData.data.password : "",
      confirmPassword: registerSecurityData
        ? registerSecurityData.data.confirmPassword
        : "",
    },
  });

  useEffect(() => {
    const checkExpiration = async () => {
      const stored = getItem("register-security");
      if (!stored) return;

      try {
        const parsed: RegisterSecurityStore = JSON.parse(stored);
        if (typeof parsed.expiresAt === "number") {
          const remainingTime = parsed.expiresAt - Date.now();
          if (remainingTime <= 0) {
            await deleteItemAsync("register-security");
            reset({
              password: "",
              confirmPassword: "",
            });
          } else {
            const timer = setTimeout(async () => {
              await deleteItemAsync("register-security");
              reset({
                password: "",
                confirmPassword: "",
              });
            }, remainingTime);
            return () => clearTimeout(timer);
          }
        }
      } catch {
        await deleteItemAsync("register-security");
        reset({
          password: "",
          confirmPassword: "",
        });
      }
    };

    let cleanupTimer: (() => void) | undefined;
    checkExpiration().then((cleanup) => {
      if (typeof cleanup === "function") {
        cleanupTimer = cleanup;
      }
    });

    return () => {
      if (cleanupTimer) cleanupTimer();
    };
  }, [reset]);

  const submit = async (formData: RegisterSecuritySchema) => {
    const timestamps = createTimestamps();
    const registerSecurityStore = {
      data: {
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      },
      ...timestamps,
    };

    await setItemAsync(
      "register-security",
      JSON.stringify(registerSecurityStore)
    );
    router.push("/(auth)/register/identity");
  };

  return (
    <AuthPagesShell>
      <AuthHeader>
        <AuthTitle>Crie sua senha</AuthTitle>
        <AuthSubtitle>
          Escolha uma senha segura para proteger sua conta
        </AuthSubtitle>
      </AuthHeader>

      <VStack className="flex-1 pt-10" space="lg">
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <FormControl isRequired isInvalid={Boolean(errors.password)}>
              <FormControlLabel>
                <FormControlLabelText>Senha</FormControlLabelText>
              </FormControlLabel>
              <Input>
                <InputSlot>
                  <InputIcon as={Lock} />
                </InputSlot>
                <InputField
                  testID="register-password-input"
                  type={showPassword ? "text" : "password"}
                  secureTextEntry={!showPassword}
                  onChangeText={field.onChange}
                  value={field.value}
                  onBlur={field.onBlur}
                  placeholder="•••••••"
                />
                <InputSlot onPress={() => setShowPassword(!showPassword)}>
                  <InputIcon as={showPassword ? EyeOff : Eye} />
                </InputSlot>
              </Input>
              <FormControlError>
                <FormControlErrorText>
                  {errors.password?.message}
                </FormControlErrorText>
              </FormControlError>
            </FormControl>
          )}
        />

        <Controller
          name="confirmPassword"
          control={control}
          render={({ field }) => (
            <FormControl isRequired isInvalid={Boolean(errors.confirmPassword)}>
              <FormControlLabel>
                <FormControlLabelText>Confirmar Senha</FormControlLabelText>
              </FormControlLabel>
              <Input>
                <InputSlot>
                  <InputIcon as={KeyRound} />
                </InputSlot>
                <InputField
                  testID="register-confirm-password-input"
                  type={showConfirmPassword ? "text" : "password"}
                  secureTextEntry={!showConfirmPassword}
                  onChangeText={field.onChange}
                  value={field.value}
                  onBlur={field.onBlur}
                  placeholder="•••••••"
                />
                <InputSlot
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <InputIcon as={showConfirmPassword ? EyeOff : Eye} />
                </InputSlot>
              </Input>
              <FormControlError>
                <FormControlErrorText>
                  {errors.confirmPassword?.message}
                </FormControlErrorText>
              </FormControlError>
            </FormControl>
          )}
        />
      </VStack>

      <AuthButtonsContainer>
        <AuthButtonBack
          variant="half"
          disabled={isSubmitting}
          onPress={() => router.back()}
          testId="register-security-back-button"
        >
          Voltar
        </AuthButtonBack>
        <AuthButtonNext
          variant="half"
          disabled={isSubmitting}
          onPress={handleSubmit(submit)}
          testId="register-security-continue-button"
        >
          Continuar
        </AuthButtonNext>
      </AuthButtonsContainer>
    </AuthPagesShell>
  );
}
