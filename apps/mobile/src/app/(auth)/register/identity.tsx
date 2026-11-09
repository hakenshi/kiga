import { AuthButtonBack, AuthButtonNext, AuthButtonsContainer } from "@/components/auth/auth-pages-buttons";
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
import { useRegisterStore } from "@/stores/register-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
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

export default function IdentityPage() {
  const router = useRouter();

  const gender = useRegisterStore((s) => s.gender);
  const pronoun = useRegisterStore((s) => s.pronoun);
  const setStep3Data = useRegisterStore((s) => s.setStep3Data);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterIdentitySchema>({
    resolver: zodResolver(registerIdentitySchema),
    defaultValues: {
      gender,
      pronoun,
    },
  });

  const submit = (formData: RegisterIdentitySchema) => {
    const validatedData = registerIdentitySchema.safeParse(formData);

    if (!validatedData.success) {
      return;
    }

    setStep3Data(validatedData.data);
    router.push("/(auth)/register/pin");
  };

  const handleBack = () => {
    router.back();
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
                      rounding="xl"
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
                      rounding="xl"
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
        <AuthButtonBack onPress={handleBack} variant="half">
          Voltar
        </AuthButtonBack>
        <AuthButtonNext
          testId="register-identity-continue-button"
          disabled={isSubmitting}
          onPress={handleSubmit(submit)}
          variant="half"
        >
          Continuar
        </AuthButtonNext>
      </AuthButtonsContainer>
    </AuthPagesShell>
  );
}
