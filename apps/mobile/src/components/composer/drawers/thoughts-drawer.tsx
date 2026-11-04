import { useState } from "react";
import { Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Brain, Check, Plus, Search, X } from "lucide-react-native";
import NavButton from "@/app/(home)/_components/nav-button";
import { Button, ButtonText } from "@/components/ui/button";
import {
  Drawer,
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
} from "@/components/ui/drawer";
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
} from "@/components/ui/form-control";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import defaultThoughts from "@/lib/data/thoughts.json";
import { createThoughtFormSchema } from "@/lib/db/zod/zod-schemas";
import { useNewPostStore } from "@/stores/new-post-store";

export default function ThoughtsDrawer() {
  const { top, bottom } = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const thoughts = useNewPostStore((s) => s.thoughts);
  const toggleThought = useNewPostStore((s) => s.toggleThought);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<CreateThoughtFormSchema>({
    resolver: zodResolver(createThoughtFormSchema),
    defaultValues: {
      name: "",
    },
  });

  const handleOpen = () => {
    setSearchQuery("");
    reset({ name: "" });
    setOpen(true);
  };

  const onSubmitThought = (data: CreateThoughtFormSchema) => {
    const alreadySelected = thoughts.some(
      (t) => t.name.toLowerCase() === data.name.toLowerCase()
    );
    if (!alreadySelected) {
      toggleThought({ name: data.name });
    }
    reset({ name: "" });
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();

  // Custom thoughts added specifically to this entry (not in defaultThoughts)
  const entryCustomThoughts = thoughts.filter(
    (t) =>
      !defaultThoughts.some(
        (d) => d.name.toLowerCase() === t.name.toLowerCase()
      ) &&
      (!normalizedQuery ? true : t.name.toLowerCase().includes(normalizedQuery))
  );

  const filteredDefaults = defaultThoughts.filter((item) =>
    !normalizedQuery ? true : item.name.toLowerCase().includes(normalizedQuery)
  );

  return (
    <>
      <NavButton Icon={Brain} badge={thoughts.length} onPress={handleOpen}>
        Pensamentos
      </NavButton>

      <Drawer
        isOpen={open}
        onClose={() => {
          setSearchQuery("");
          setOpen(false);
        }}
        size="full"
        anchor="bottom"
      >
        <DrawerBackdrop />
        <DrawerContent
          className="h-full rounded-none px-6 bg-white"
          style={{ paddingTop: top + 12, paddingBottom: bottom + 16 }}
        >
          <DrawerHeader className="pb-4 items-start justify-between">
            <VStack space="xs" className="flex-1 pr-2">
              <Text className="text-[18px] font-heading text-[#16181D]">
                Pensamentos automáticos
              </Text>
              <Text className="text-xs font-subtitle text-[#5A606B]">
                O que passou pela sua mente neste momento?
              </Text>
            </VStack>
            <DrawerCloseButton className="w-8 h-8 rounded-full bg-[#F2F3F5] items-center justify-center p-0">
              <X size={16} color="#5A606B" />
            </DrawerCloseButton>
          </DrawerHeader>

          <VStack
            space="xs"
            className="mb-3 p-3.5 rounded-xl bg-[#F2F3F5] border border-[#E6E8EC]"
          >
            <Text className="text-xs font-subtitle-medium text-[#5A606B]">
              Novo pensamento deste relato:
            </Text>
            <Controller
              control={control}
              name="name"
              render={({ field, fieldState }) => (
                <FormControl isInvalid={Boolean(fieldState.error)}>
                  <HStack space="sm" className="items-center">
                    <Input className="flex-1 h-10 rounded-lg bg-white border-[#E6E8EC] shadow-none px-3">
                      <InputField
                        value={field.value}
                        onChangeText={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="Escreva um pensamento deste relato..."
                        maxLength={120}
                        returnKeyType="done"
                        onSubmitEditing={handleSubmit(onSubmitThought)}
                      />
                    </Input>
                    <Button
                      size="sm"
                      className="h-10 rounded-lg px-3.5 bg-[#16181D]"
                      disabled={isSubmitting}
                      onPress={handleSubmit(onSubmitThought)}
                    >
                      <Plus size={14} color="#FFFFFF" />
                      <ButtonText>Adicionar</ButtonText>
                    </Button>
                  </HStack>
                  <FormControlError>
                    <FormControlErrorText>
                      {fieldState.error?.message}
                    </FormControlErrorText>
                  </FormControlError>
                </FormControl>
              )}
            />
          </VStack>

          <Input className="h-11 rounded-xl bg-[#F2F3F5] border-transparent data-[focus=true]:bg-white data-[focus=true]:border-[#16181D] shadow-none px-3.5 mb-2">
            <Search size={18} color="#9AA0AA" />
            <InputField
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar nas sugestões..."
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
                <X size={16} color="#9AA0AA" />
              </Pressable>
            )}
          </Input>

          <DrawerBody
            className="flex-1 mt-2 mb-2"
            showsVerticalScrollIndicator={false}
          >
            {entryCustomThoughts.length > 0 && (
              <VStack className="mb-5" space="sm">
                <Text className="text-[13px] font-subtitle-medium text-[#5A606B]">
                  Deste relato
                </Text>
                <VStack space="xs">
                  {entryCustomThoughts.map((item) => (
                    <Pressable
                      key={item.name}
                      onPress={() => toggleThought(item)}
                      className="flex-row items-center rounded-xl px-3.5 py-3 gap-2.5 border bg-[#F0ECFA] border-[#4B3B8F]"
                    >
                      <Check size={16} color="#4B3B8F" />
                      <Text className="text-[14px] flex-1 text-[#4B3B8F] font-medium">
                        “{item.name}”
                      </Text>
                    </Pressable>
                  ))}
                </VStack>
              </VStack>
            )}

            {filteredDefaults.length > 0 && (
              <VStack space="sm" className="pb-4">
                <Text className="text-[13px] font-subtitle-medium text-[#5A606B]">
                  Sugestões comuns
                </Text>
                <VStack space="xs">
                  {filteredDefaults.map((item) => {
                    const isSelected = thoughts.some(
                      (t) => t.name.toLowerCase() === item.name.toLowerCase()
                    );
                    return (
                      <Pressable
                        key={item.name}
                        onPress={() => toggleThought({ name: item.name })}
                        className={`flex-row items-center rounded-xl px-3.5 py-3 gap-2.5 border ${
                          isSelected
                            ? "bg-[#F0ECFA] border-[#4B3B8F]"
                            : "bg-white border-[#E6E8EC]"
                        }`}
                      >
                        {isSelected && <Check size={16} color="#4B3B8F" />}
                        <Text
                          className={`text-[14px] flex-1 ${
                            isSelected
                              ? "text-[#4B3B8F] font-medium"
                              : "text-[#16181D] font-normal"
                          }`}
                        >
                          “{item.name}”
                        </Text>
                      </Pressable>
                    );
                  })}
                </VStack>
              </VStack>
            )}
          </DrawerBody>

          <DrawerFooter className="pt-2">
            <Button
              className="w-full h-[52px] rounded-[14px] bg-[#16181D]"
              onPress={() => setOpen(false)}
            >
              <ButtonText className="text-[15px] font-semibold text-white">
                {thoughts.length === 0
                  ? "Concluir"
                  : thoughts.length === 1
                    ? "Adicionar 1 pensamento"
                    : `Adicionar ${thoughts.length} pensamentos`}
              </ButtonText>
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
