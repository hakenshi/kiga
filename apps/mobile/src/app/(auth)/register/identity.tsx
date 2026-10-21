import { AuthButtonNext, AuthButtonsContainer } from "@/components/auth/auth-pages-buttons";
import { AuthHeader, AuthSubtitle, AuthTitle } from "@/components/auth/auth-pages-header";
import AuthPagesShell from "@/components/auth/auth-pages-shell";
import { Button, ButtonText } from "@/components/ui/button";
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { VStack } from "@/components/ui/vstack";
import { registerIdentitySchema } from "@/lib/db/zod/zod-schemas";
import { createTimestamps, isExpired } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { deleteItemAsync, getItem, setItemAsync } from "expo-secure-store";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";

export const GENDER_OPTIONS = [
  { label: "Masculino", value: "male" },
  { label: "Feminino", value: "female" },
  { label: "Não-binário", value: "non_binary" },
  { label: "Outro", value: "other" },
  { label: "Prefiro não dizer", value: "prefer_not_to_say" },
] as const;

export const PRONOUN_OPTIONS = [
  { label: "Ele/Dele", value: "he_him" },
  { label: "Ela/Dela", value: "she_her" },
  { label: "Elu/Delu", value: "they_them" },
  { label: "Outro", value: "other" },
] as const;

type RegisterIdentityStore = {
  data: RegisterIdentitySchema;
  updatedAt: number;
  expiresAt: number;
};

export default function IdentityPage() {
  const router = useRouter();

  const registerIdentity = getItem("register-identity");
  const registerIdentityData: RegisterIdentityStore | null = (() => {
    if (!registerIdentity) return null;
    try {
      const parsed: RegisterIdentityStore = JSON.parse(registerIdentity);
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
  } = useForm<RegisterIdentitySchema>({
    resolver: zodResolver(registerIdentitySchema),
    defaultValues: {
      gender: registerIdentityData ? registerIdentityData.data.gender : undefined,
      pronoun: registerIdentityData ? registerIdentityData.data.pronoun : undefined,
    },
  });

  useEffect(() => {
    const checkExpiration = async () => {
      const stored = getItem("register-identity");
      if (!stored) return;

      try {
        const parsed: RegisterIdentityStore = JSON.parse(stored);
        if (typeof parsed.expiresAt === "number") {
          const remainingTime = parsed.expiresAt - Date.now();
          if (remainingTime <= 0) {
            await deleteItemAsync("register-identity");
            reset({
              gender: undefined,
              pronoun: undefined,
            });
          } else {
            const timer = setTimeout(async () => {
              await deleteItemAsync("register-identity");
              reset({
                gender: undefined,
                pronoun: undefined,
              });
            }, remainingTime);
            return () => clearTimeout(timer);
          }
        }
      } catch {
        await deleteItemAsync("register-identity");
        reset({
          gender: undefined,
          pronoun: undefined,
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

  const submit = async (formData: RegisterIdentitySchema) => {
    const validatedData = registerIdentitySchema.safeParse(formData);

    if (!validatedData.success) {
      return;
    }

    const timestamps = createTimestamps();
    const registerIdentityStore: RegisterIdentityStore = {
      data: validatedData.data,
      ...timestamps,
    };

    await setItemAsync(
      "register-identity",
      JSON.stringify(registerIdentityStore)
    );
    router.push("/(auth)/register/pin");
  };

  return (
    <AuthPagesShell>
      <AuthHeader>
        <AuthTitle>Como você se identifica?</AuthTitle>
        <AuthSubtitle>
          Escolha seu gênero e pronome para personalizarmos sua experiência
        </AuthSubtitle>
      </AuthHeader>

      <VStack className="flex-1 pt-10" space="lg">
        <FormControl isRequired isInvalid={Boolean(errors.gender)}>
          <FormControlLabel>
            <FormControlLabelText>Gênero</FormControlLabelText>
          </FormControlLabel>
          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <View className="flex-row flex-wrap gap-2">
                {GENDER_OPTIONS.map((option) => {
                  const isSelected = field.value === option.value;
                  return (
                    <Button
                      key={option.value}
                      testID={`gender-${option.value}`}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className="rounded-xl"
                      onPress={() => field.onChange(option.value)}
                    >
                      <ButtonText>{option.label}</ButtonText>
                    </Button>
                  );
                })}
              </View>
            )}
          />
          <FormControlError>
            <FormControlErrorText>{errors.gender?.message}</FormControlErrorText>
          </FormControlError>
        </FormControl>

        <FormControl isRequired isInvalid={Boolean(errors.pronoun)}>
          <FormControlLabel>
            <FormControlLabelText>Pronome</FormControlLabelText>
          </FormControlLabel>
          <Controller
            name="pronoun"
            control={control}
            render={({ field }) => (
              <View className="flex-row flex-wrap gap-2">
                {PRONOUN_OPTIONS.map((option) => {
                  const isSelected = field.value === option.value;
                  return (
                    <Button
                      key={option.value}
                      testID={`pronoun-${option.value}`}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className="rounded-xl"
                      onPress={() => field.onChange(option.value)}
                    >
                      <ButtonText>{option.label}</ButtonText>
                    </Button>
                  );
                })}
              </View>
            )}
          />
          <FormControlError>
            <FormControlErrorText>{errors.pronoun?.message}</FormControlErrorText>
          </FormControlError>
        </FormControl>
      </VStack>

      <AuthButtonsContainer>
        <AuthButtonNext
          testId="register-identity-continue-button"
          disabled={isSubmitting}
          onPress={handleSubmit(submit)}
        >
          Continuar
        </AuthButtonNext>
      </AuthButtonsContainer>
    </AuthPagesShell>
  );
}
