import { Avatar, AvatarFallbackText } from "@/components/ui/avatar";
import { Button, ButtonGroup, ButtonIcon, ButtonText } from "@/components/ui/button";
import { FormControl, FormControlError, FormControlErrorText, FormControlLabel, FormControlLabelText } from "@/components/ui/form-control";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { VStack } from "@/components/ui/vstack";
import { userUpdateSchema } from "@/lib/db/zod/schemas/auth.schema";
import { formatDateMask } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { ArrowLeft, AtSign, Calendar, CameraIcon, ImageIcon, PencilIcon, User } from "lucide-react-native";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, Text, View } from "react-native";

export default function EditProfilePage() {
  const user = useAuthStore(u => u.user)

  const [date] = useState(() => new Date())

  const {
    control,
    handleSubmit,
    formState: {
      errors,
      isSubmitting
    }
  } = useForm<UserUpdate>({
    resolver: zodResolver(userUpdateSchema),
    defaultValues: {
      firstName: user?.firstName,
      secondName: user?.secondName,
      username: user?.username,
      birthDate: user ? user?.birthDate : date,
      gender: user?.gender ?? "other",
      pronoun: user?.pronoun ?? "other"
    }
  })


  return (
    <ScrollView className="flex-1 bg-background">
      <VStack>
        <LinearGradient
          className="flex-1 h-30 px-2 py-2"
          colors={["#18181B", "#27272A", "#3F3F46"]}
        >
          <Link href="/profile" asChild>
            <Button variant="ghost" rounding="full" size="md" className="size-10">
              <ButtonIcon as={ArrowLeft} color="white" />
            </Button>
          </Link>
        </LinearGradient>
        <HStack className="px-2 py-4 justify-between" space="md">
          <HStack space="md">
            <Avatar className="bg-black">
              <AvatarFallbackText className="text-white">
                {user?.firstName}
              </AvatarFallbackText>
            </Avatar>
            <View>
              <Text className="font-semibold text-lg">
                {user?.firstName} {user?.secondName}
              </Text>
              <Text className="text-sm text-zinc-500">
                @{user?.username} - Desde {user ? format(user.createdAt, "MMM yyyy", { locale: ptBR }) : ""}
              </Text>
            </View>
          </HStack>
          <Button variant="secondary" size="md" rounding="full">
            <ButtonIcon as={CameraIcon} />
            <ButtonText>
              Trocar Fundo
            </ButtonText>
          </Button>
        </HStack>
        <VStack space="md" className="px-2 py-4 justify-between flex-1 border-t border-accent">
          <HStack className="w-full" space="xs">
            <Controller
              name="firstName"
              control={control}
              render={({ field }) => (
                <FormControl

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
              <FormControl isInvalid={Boolean(errors.username)}>
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
                    value={format(parseISO(field.value?.toString().substring(0, 10)), "dd/MM/yyyy", { locale: ptBR })}
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

      </VStack>
    </ScrollView >
  )
}
