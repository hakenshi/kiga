import { AuthButtonNext, AuthButtonsContainer } from "@/components/auth/auth-pages-buttons";
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
import { createTimestamps, formatDateMask, isExpired, toMaskedDate } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { deleteItemAsync, getItem, setItemAsync } from "expo-secure-store";
import { AtSign, Calendar, User } from "lucide-react-native";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

type RegisterNameStore = {
  data: {
    firstName: string;
    secondName: string;
    username: string;
    birthDate?: string;
  };
  updatedAt: number;
  expiresAt: number;
};

export default function NamePage() {
  const router = useRouter();

  const registerName = getItem("register-name");
  const registerNameData: RegisterNameStore | null = (() => {
    if (!registerName) return null;
    try {
      const parsed: RegisterNameStore = JSON.parse(registerName);
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
  } = useForm<RegisterNameInput, any, RegisterNameSchema>({
    resolver: zodResolver(registerNameSchema),
    defaultValues: {
      firstName: registerNameData ? registerNameData.data.firstName : "",
      secondName: registerNameData ? registerNameData.data.secondName : "",
      username: registerNameData ? registerNameData.data.username : "",
      birthDate: registerNameData?.data.birthDate
        ? toMaskedDate(registerNameData.data.birthDate)
        : "",
    },
  });

  useEffect(() => {
    const checkExpiration = async () => {
      const stored = getItem("register-name");
      if (!stored) return;

      try {
        const parsed: RegisterNameStore = JSON.parse(stored);
        if (typeof parsed.expiresAt === "number") {
          const remainingTime = parsed.expiresAt - Date.now();
          if (remainingTime <= 0) {
            await deleteItemAsync("register-name");
            reset({
              firstName: "",
              secondName: "",
              username: "",
              birthDate: "",
            });
          } else {
            const timer = setTimeout(async () => {
              await deleteItemAsync("register-name");
              reset({
                firstName: "",
                secondName: "",
                username: "",
                birthDate: "",
              });
            }, remainingTime);
            return () => clearTimeout(timer);
          }
        }
      } catch {
        await deleteItemAsync("register-name");
        reset({
          firstName: "",
          secondName: "",
          username: "",
          birthDate: "",
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

  const submit = async (formData: RegisterNameSchema) => {
    const timestamps = createTimestamps();
    const registerStore = {
      data: {
        ...formData,
        birthDate: formData.birthDate.toISOString(),
      },
      ...timestamps,
    };

    await setItemAsync("register-name", JSON.stringify(registerStore));
    router.push("/(auth)/register/security");
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
                value={
                  typeof field.value === "string"
                    ? field.value
                    : toMaskedDate(field.value)
                }
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
        <AuthButtonNext
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
