import { Brain, Check, Plus, Search, X } from "lucide-react-native";
import NavButton from "@/components/common/nav-button";
import { Button, ButtonText } from "@/components/ui/button";
import { Drawer, DrawerBackdrop, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader } from "@/components/ui/drawer";
import { FormControl, FormControlError, FormControlErrorText } from "@/components/ui/form-control";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { thoughtCreateFormSchema } from "@/lib/db/zod/schemas/thought/index.schema";
import { useAuthStore } from "@/stores/auth-store";
import { useThoughtStore } from "@/stores/thought-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  selectedIds: number[];
  onToggle: (id: number) => void;
}

export default function ThoughtsDrawer({ selectedIds: selectedThoughts, onToggle: toggleThought }: Props) {
  const { top, bottom } = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const userId = useAuthStore((s) => s.user!.id);
  const thoughts = useThoughtStore((s) => s.thoughts);
  const addThought = useThoughtStore((s) => s.addThought);
  const searchThoughts = useThoughtStore((s) => s.searchThoughts);
  const loadThoughts = useThoughtStore((s) => s.loadThoughts);
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<Pick<ThoughtInsert, "name">>({
    resolver: zodResolver(thoughtCreateFormSchema),
    defaultValues: { name: "" },
  });

  const handleOpen = () => {
    setSearchQuery("");
    reset({ name: "" });
    setOpen(true);
    loadThoughts(userId);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    searchThoughts(query, { userId });
  };

  const onSubmitThought = (data: Pick<ThoughtInsert, "name">) => {
    const thought = addThought({ ...data, userId });
    if (!thought) return;
    toggleThought(thought.id);
    handleSearch("");
    reset({ name: "" });
  };

  return (
    <>
      <NavButton Icon={Brain} badge={selectedThoughts.length} onPress={handleOpen}>
        Pensamentos
      </NavButton>
      <Drawer isOpen={open} onClose={() => setOpen(false)} size="full" anchor="bottom">
        <DrawerBackdrop />
        <DrawerContent
          className="h-full rounded-none px-6 bg-white"
          style={{ paddingTop: top + 12, paddingBottom: bottom + 16 }}
        >
          <DrawerHeader className="pb-4 flex-row items-center gap-3">
            <DrawerCloseButton className="w-10 h-10 rounded-full bg-[#F2F3F5] items-center justify-center p-0 active:opacity-75">
              <X size={18} color="#16181D" />
            </DrawerCloseButton>
            <VStack space="xs" className="flex-1">
              <Text className="text-[18px] font-heading text-[#16181D]">
                Pensamentos automáticos
              </Text>
              <Text className="text-xs font-subtitle text-[#5A606B]">
                O que passou pela sua mente neste momento?
              </Text>
            </VStack>
          </DrawerHeader>
          <VStack
            space="xs"
            className="mb-3 p-3.5 rounded-xl bg-[#F2F3F5] border border-[#E6E8EC]"
          >
            <Text className="text-xs font-subtitle-medium text-[#5A606B]">
              Novo pensamento desta nota:
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
                        placeholder="Escreva um pensamento desta nota..."
                        maxLength={120}
                        returnKeyType="done"
                        onSubmitEditing={handleSubmit(onSubmitThought)}
                      />
                    </Input>
                    <Button
                      size="sm"
                      rounding="lg"
                      className="h-10 px-3.5 bg-[#16181D]"
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
              onChangeText={handleSearch}
              placeholder="Buscar nas sugestões..."
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => handleSearch("")} hitSlop={8}>
                <X size={16} color="#9AA0AA" />
              </Pressable>
            )}
          </Input>
          <DrawerBody className="flex-1 mt-2 mb-2" showsVerticalScrollIndicator={false}>
            <VStack space="xs" className="pb-4">
              {thoughts.map(item => {
                const isSelected = selectedThoughts.includes(item.id);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => toggleThought(item.id)}
                    className={`flex-row items-center rounded-xl px-3.5 py-3 gap-2.5 border ${isSelected
                      ? "bg-[#F0ECFA] border-[#4B3B8F]"
                      : "bg-white border-[#E6E8EC]"
                      }`}
                  >
                    {isSelected && <Check size={16} color="#4B3B8F" />}
                    <Text className={`text-[14px] flex-1 ${isSelected
                      ? "text-[#4B3B8F] font-medium"
                      : "text-[#16181D] font-normal"
                      }`}>
                      “{item.name}”
                    </Text>
                  </Pressable>
                );
              })}
              {thoughts.length === 0 && (
                <Text className="text-sm font-subtitle text-[#5A606B]">
                  Nenhum pensamento encontrado.
                </Text>
              )}
            </VStack>
          </DrawerBody>
          <DrawerFooter className="pt-2">
            <Button rounding="2xl" className="w-full h-[52px] bg-[#16181D]" onPress={() => setOpen(false)}>
              <ButtonText className="text-[15px] font-semibold text-white">
                {selectedThoughts.length === 0 && "Concluir"}
                {selectedThoughts.length > 0 &&
                  `Adicionar ${selectedThoughts.length} pensamento${selectedThoughts.length === 1 ? "" : "s"}`}
              </ButtonText>
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
