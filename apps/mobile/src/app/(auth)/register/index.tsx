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
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { registerNameSchema } from "@/lib/db/zod/zod-schemas";
import { formatDateMask, toMaskedDate } from "@/lib/utils";
import { useRegisterStore } from "@/stores/register-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { AtSign, Calendar, User } from "lucide-react-native";
import { Controller, useForm } from "react-hook-form";

export default function NamePage() {
  const router = useRouter();
  const firstName = useRegisterStore((s) => s.firstName);
  const secondName = useRegisterStore((s) => s.secondName);
  const username = useRegisterStore((s) => s.username);
  const birthDate = useRegisterStore((s) => s.birthDate);
  const setStep1Data = useRegisterStore((s) => s.setStep1Data);
  const reset = useRegisterStore((s) => s.reset);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterNameInput, any, RegisterNameSchema>({
    resolver: zodResolver(registerNameSchema),
    defaultValues: {
      firstName,
      secondName,
      username,
      birthDate: birthDate ? toMaskedDate(birthDate) : "",
    },
  });

  const submit = (formData: RegisterNameSchema) => {
    setStep1Data({
      firstName: formData.firstName,
      secondName: formData.secondName,
      username: formData.username,
      birthDate: formData.birthDate.toISOString(),
    });
    router.push("/(auth)/register/security");
  };

  const handleBack = () => {
    reset();
    router.push("/");
  };

  return (
    <AuthPagesShell>
      <AuthHeader>
        <AuthTitle>Como podemos te chamar?</AuthTitle>
        <AuthSubtitle>Crie sua identidade no kiga</AuthSubtitle>
      </AuthHeader>

      <VStack className="flex-1 pt-10 items-center" space="lg">
        <HStack className="w-full" space="xs">
          <Controller
            name="firstName"
            control={control}
            render={({ field }) => (
              <FormControl
                isRequired
                isInvalid={Boolean(errors.firstName)}
                className="w-1/2"
              >
                <FormControlLabel>
                  <FormControlLabelText>Primeiro Nome</FormControlLabelText>
                </FormControlLabel>
                <Input className="w-full">
                  <InputSlot>
                    <InputIcon as={User} />
                  </InputSlot>
                  <InputField
                    testID="register-firstname-input"
                    onChangeText={field.onChange}
                    value={field.value}
                    onBlur={field.onBlur}
                    placeholder="Insira seu primeiro nome"
                  />
                </Input>
                <FormControlError>
                  <FormControlErrorText>
                    {errors.firstName?.message}
                  </FormControlErrorText>
                </FormControlError>
              </FormControl>
            )}
          />

          <Controller
            name="secondName"
            control={control}
            render={({ field }) => (
              <FormControl
                isRequired
                isInvalid={Boolean(errors.secondName)}
                className="w-1/2"
              >
                <FormControlLabel>
                  <FormControlLabelText>Sobrenome</FormControlLabelText>
                </FormControlLabel>
                <Input>
                  <InputSlot>
                    <InputIcon as={User} />
                  </InputSlot>
                  <InputField
                    testID="register-secondname-input"
                    onChangeText={field.onChange}
                    value={field.value}
                    onBlur={field.onBlur}
                    placeholder="Insira seu sobrenome"
                  />
                </Input>
                <FormControlError>
                  <FormControlErrorText>
                    {errors.secondName?.message}
                  </FormControlErrorText>
                </FormControlError>
              </FormControl>
            )}
          />
        </HStack>

        <Controller
          name="username"
          control={control}
          render={({ field }) => (
            <FormControl isRequired isInvalid={Boolean(errors.username)}>
              <FormControlLabel>
                <FormControlLabelText>Nome de Usuário</FormControlLabelText>
              </FormControlLabel>
              <Input>
                <InputSlot>
                  <InputIcon as={AtSign} />
                </InputSlot>
                <InputField
                  testID="register-username-input"
                  autoCapitalize="none"
                  onChangeText={field.onChange}
                  value={field.value}
                  onBlur={field.onBlur}
                  placeholder="Insira seu nome de usuário"
                />
              </Input>
              <FormControlError>
                <FormControlErrorText>
                  {errors.username?.message}
                </FormControlErrorText>
              </FormControlError>
            </FormControl>
          )}
        />

        <Controller
          name="birthDate"
          control={control}
          render={({ field }) => (
            <FormControl isRequired isInvalid={Boolean(errors.birthDate)}>
              <FormControlLabel>
                <FormControlLabelText>Data de Nascimento</FormControlLabelText>
              </FormControlLabel>
              <Input>
                <InputSlot>
                  <InputIcon as={Calendar} />
                </InputSlot>
                <InputField
                  testID="register-birthdate-input"
                  keyboardType="numeric"
                  maxLength={10}
                  onChangeText={(text) => field.onChange(formatDateMask(text))}
                  value={field.value as string}
                  onBlur={field.onBlur}
                  placeholder="DD/MM/AAAA"
                />
              </Input>
              <FormControlError>
                <FormControlErrorText>
                  {errors.birthDate?.message}
                </FormControlErrorText>
              </FormControlError>
            </FormControl>
          )}
        />
      </VStack>

      <AuthButtonsContainer>
        <AuthButtonBack onPress={handleBack} variant="half">
          Voltar
        </AuthButtonBack>
        <AuthButtonNext
          variant="half"
          disabled={isSubmitting}
          testId="register-continue-button"
          onPress={handleSubmit(submit)}
        >
          Continuar
        </AuthButtonNext>
      </AuthButtonsContainer>
    </AuthPagesShell>
  );
}
