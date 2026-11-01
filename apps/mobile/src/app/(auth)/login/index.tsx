import { AuthSubtitle, AuthTitle } from "@/components/auth/auth-pages-header";
import { AuthButtonNext, AuthButtonsContainer } from "@/components/auth/auth-pages-buttons";
import { Button, ButtonGroup, ButtonText } from "@/components/ui/button";
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { VStack } from "@/components/ui/vstack";
import db from "@/lib/db";
import { users } from "@/lib/db/schema";
import { loginSchema } from "@/lib/db/zod/zod-schemas";
import { useAuthStore } from "@/stores/auth-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { eq } from "drizzle-orm";
import { useRouter } from "expo-router";
import { AtSign, Eye, EyeOff, Lock } from "lucide-react-native";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import Logo from "@/components/Logo";
import { View } from "react-native";
import { useEntryStore } from "@/stores/journal-store";

export default function LoginPage() {
  const router = useRouter();
  const [useCloud, setUseCloud] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const authStore = useAuthStore();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      password: "",
      username: "",
    },
  });

  const { loadInitial } = useEntryStore()

  const submit = async (data: LoginSchema) => {
    const { data: userData, success } = loginSchema.safeParse(data);

    if (!success) {
      console.log("erro de validação");
      return;
    }

    const user = await db.query.users.findFirst({
      where: eq(users.username, userData.username),
      with: {
        emotions: true,
        journalEntries: true,
        moods: true,
        profileImages: true,
        reactions: true,
        thoughts: true
      }
    });
    if (!user) {
      setError("username", {
        type: "manual",
        message: "Nome de usuário ou senha incorretos",
      });
      return;
    }

    loadInitial(user.id)

    const isPasswordValid = true;

    if (!isPasswordValid) {
      setError("username", {
        type: "manual",
        message: "Nome de usuário ou senha incorretos",
      });
      return;
    }

    authStore.setUser({ user, isAuthenticated: true });
    router.navigate("/home");
  };

  return (
    <VStack className="flex-1 px-5 py-20 justify-center">

      <VStack className="items-center">
        <View className="items-center justify-center py-5">
          <Logo />
        </View>
        <AuthTitle>Bem-vindo de volta!</AuthTitle>
        <AuthSubtitle>Acesse sua conta para continuar no Kiga</AuthSubtitle>
      </VStack>
      <VStack space="lg" className=" flex-1 pt-20">

        <Controller
          control={control}
          name="username"
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
                  testID="username-input"
                  autoCapitalize="none"
                  value={field.value}
                  onChangeText={field.onChange}
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
          control={control}
          name="password"
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
                  testID="password-input"
                  type={showPassword ? "text" : "password"}
                  secureTextEntry={!showPassword}
                  value={field.value}
                  onChangeText={field.onChange}
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

        <HStack className="justify-between items-center py-1">
          <FormControlLabel>
            <FormControlLabelText className="text-zinc-600 text-sm">
              Fazer login na nuvem?
            </FormControlLabelText>
          </FormControlLabel>
          <Switch
            value={useCloud}
            onValueChange={(val) => setUseCloud(val)}
          />
        </HStack>
      </VStack>

      <AuthButtonsContainer>
        <VStack space="md" className="w-full">
          <AuthButtonNext
            testId="login-button"
            disabled={isSubmitting}
            onPress={handleSubmit(submit)}
          >
            Entrar
          </AuthButtonNext>

          <ButtonGroup className="justify-center items-center">
            <Button
              variant="link"
              className="shadow-none"
              onPress={() => router.navigate("/")}
            >
              <ButtonText>Início</ButtonText>
            </Button>
            <Button
              variant="link"
              className="shadow-none"
              onPress={() => router.navigate("/(auth)/register")}
            >
              <ButtonText>Criar uma conta</ButtonText>
            </Button>
          </ButtonGroup>
        </VStack>
      </AuthButtonsContainer>
    </VStack>
  );
}
