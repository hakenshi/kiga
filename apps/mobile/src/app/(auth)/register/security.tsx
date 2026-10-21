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
import {
  createTimestamps,
  getStoredItem,
  removeStoredItem,
  setStoredItem,
} from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { Eye, EyeOff, KeyRound, Lock } from "lucide-react-native";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

export default function SecurityPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const registerSecurityData = getStoredItem<{
    password: string;
    confirmPassword: string;
  }>("register-security");

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterSecurityInput, any, RegisterSecuritySchema>({
    resolver: zodResolver(registerSecuritySchema),
    defaultValues: {
      password: registerSecurityData?.password ?? "",
      confirmPassword: registerSecurityData?.confirmPassword ?? "",
    },
  });

  const submit = async (formData: RegisterSecuritySchema) => {
    const timestamps = createTimestamps();
    await setStoredItem(
      "register-security",
      {
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      },
      timestamps.expiresAt
    );
    router.push("/(auth)/register/identity");
  };

  const handleBack = async () => {
    await removeStoredItem("register-security");
    router.back();
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
          onPress={handleBack}
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
