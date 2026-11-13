import {
  Check,
  CornerDownLeft,
  Drama,
  FolderPlus,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react-native";
import { Button, ButtonText } from "@/components/ui/button";
import NavButton from "@/components/common/nav-button";
import { Drawer, DrawerBackdrop, DrawerContent, DrawerHeader, DrawerCloseButton, DrawerBody, DrawerFooter } from "@/components/ui/drawer";
import { FormControl, FormControlError, FormControlErrorText } from "@/components/ui/form-control";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAuthStore } from "@/stores/auth-store";
import { useEmotionStore } from "@/stores/emotion-store";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ActiveForm = "none" | "item" | "category";

export default function EmotionsDrawer() {
  const { top, bottom } = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [activeForm] = useState<ActiveForm>("none");
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingIds] = useState<number[]>([]);

  const user = useAuthStore((s) => s.user);
  const categories = useEmotionStore((s) => s.categories);
  const loadEmotions = useEmotionStore((s) => s.loadEmotions);

  const [emotions, _setEmotions] = useState<{ id?: number; name: string }[]>([])

  const itemForm = useForm<{ name: string; categoryName: string }>({
    defaultValues: { name: "", categoryName: "" },
  });
  const categoryForm = useForm<{ name: string }>({ defaultValues: { name: "" } });
  const uncategorizedCustom: { id: number; name: string }[] = [];
  const trimmedQuery = searchQuery.trim();
  const exactMatchExists = false;
  const hasAnyMatch = false;
  const isSelectionMode = deletingIds.length > 0;

  return (
    <>
      <NavButton Icon={Drama} badge={emotions.length} onPress={() => {
        if (!user) return;
        setOpen(true);
        loadEmotions(user.id);
      }}>
        Emoções
      </NavButton>
      <Drawer
        isOpen={open}
        onClose={() => setOpen(false)}
        size="full"
        anchor="bottom"
      >
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
                O que você está sentindo?
              </Text>
              <Text className="text-xs font-subtitle text-[#5A606B]">
                Selecione ou crie emoções para este relato
              </Text>
            </VStack>
          </DrawerHeader>

          <Input className="h-11 rounded-xl bg-[#F2F3F5] border-transparent data-[focus=true]:bg-white data-[focus=true]:border-[#16181D] shadow-none px-3.5 mb-2.5">
            <Search size={18} color="#9AA0AA" />
            <InputField
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar emoção..."
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => console.log("refactoring")} hitSlop={8}>
                <X size={16} color="#9AA0AA" />
              </Pressable>
            )}
          </Input>

          <HStack space="sm" className="mb-2">
            <Pressable
              onPress={() => console.log("refactoring")}
              className={`flex-1 h-10 rounded-xl flex-row items-center justify-center gap-1.5 border ${activeForm === "item"
                ? "bg-[#16181D] border-[#16181D]"
                : "bg-white border-[#E6E8EC]"
                }`}
            >
              <Plus
                size={15}
                color={activeForm === "item" ? "#FFFFFF" : "#16181D"}
              />
              <Text
                className={`text-xs font-semibold ${activeForm === "item" ? "text-white" : "text-[#16181D]"
                  }`}
              >
                Nova emoção
              </Text>
            </Pressable>

            <Pressable
              onPress={() => console.log("refactoring")}
              className={`flex-1 h-10 rounded-xl flex-row items-center justify-center gap-1.5 border ${activeForm === "category"
                ? "bg-[#16181D] border-[#16181D]"
                : "bg-white border-[#E6E8EC]"
                }`}
            >
              <FolderPlus
                size={15}
                color={activeForm === "category" ? "#FFFFFF" : "#16181D"}
              />
              <Text
                className={`text-xs font-semibold ${activeForm === "category" ? "text-white" : "text-[#16181D]"
                  }`}
              >
                Nova categoria
              </Text>
            </Pressable>
          </HStack>

          {activeForm === "item" && (
            <VStack
              space="sm"
              className="mb-3 p-3.5 rounded-xl bg-[#F2F3F5] border border-[#E6E8EC]"
            >
              <Controller
                control={itemForm.control}
                name="name"
                render={({ field, fieldState }) => (
                  <FormControl isInvalid={Boolean(fieldState.error)}>
                    <HStack space="sm" className="items-center">
                      <Input className="flex-1 h-10 rounded-lg bg-white border-[#E6E8EC] shadow-none px-3">
                        <InputField
                          value={field.value}
                          onChangeText={field.onChange}
                          onBlur={field.onBlur}
                          placeholder="Nome da nova emoção..."
                          maxLength={40}
                          autoFocus
                          returnKeyType="done"
                          onSubmitEditing={() => console.log("refactoring")}
                        />
                      </Input>
                      <Button
                        size="sm"
                        rounding="lg"
                        className="h-10 px-4 bg-[#16181D]"
                        disabled={itemForm.formState.isSubmitting}
                        onPress={() => console.log("refactoring")}
                      >
                        <ButtonText>Criar</ButtonText>
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

              <Controller
                control={itemForm.control}
                name="categoryName"
                render={({ field }) => (
                  <VStack space="xs">
                    <Text className="text-xs font-subtitle-medium text-[#5A606B]">
                      Categoria (opcional):
                    </Text>
                    <HStack className="flex-wrap gap-1.5">
                      {categories.map(({ id, name: catName }) => {
                        const isSelected = field.value === catName;
                        return (
                          <Pressable
                            key={id}
                            onPress={() => console.log("refactoring")}
                            className={`flex-row items-center h-7 rounded-lg px-2.5 gap-1 border ${isSelected
                              ? "bg-[#E8F1FB] border-[#1E4E8C]"
                              : "bg-white border-[#E6E8EC]"
                              }`}
                          >
                            {isSelected && <Check size={12} color="#1E4E8C" />}
                            <Text
                              className={`text-xs ${isSelected
                                ? "text-[#1E4E8C] font-semibold"
                                : "text-[#16181D]"
                                }`}
                            >
                              {catName}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </HStack>
                  </VStack>
                )}
              />
            </VStack>
          )}

          {activeForm === "category" && (
            <VStack
              space="sm"
              className="mb-3 p-3.5 rounded-xl bg-[#F2F3F5] border border-[#E6E8EC]"
            >
              <Controller
                control={categoryForm.control}
                name="name"
                render={({ field, fieldState }) => (
                  <FormControl isInvalid={Boolean(fieldState.error)}>
                    <HStack space="sm" className="items-center">
                      <Input className="flex-1 h-10 rounded-lg bg-white border-[#E6E8EC] shadow-none px-3">
                        <InputField
                          value={field.value}
                          onChangeText={field.onChange}
                          onBlur={field.onBlur}
                          placeholder="Nome da nova categoria..."
                          maxLength={30}
                          autoFocus
                          returnKeyType="done"
                          onSubmitEditing={() => console.log("refactoring")}
                        />
                      </Input>
                      <Button
                        size="sm"
                        rounding="lg"
                        className="h-10 px-4 bg-[#16181D]"
                        disabled={categoryForm.formState.isSubmitting}
                        onPress={() => console.log("refactoring")}
                      >
                        <ButtonText>Criar</ButtonText>
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
          )}

          <DrawerBody
            className="flex-1 mt-2 mb-2"
            showsVerticalScrollIndicator={false}
          >
            {trimmedQuery.length > 0 && !exactMatchExists && (
              <VStack space="sm" className="mb-5">
                {!hasAnyMatch && (
                  <Text className="text-sm font-subtitle text-[#5A606B]">
                    Nenhuma emoção com esse nome ainda.
                  </Text>
                )}
                <Pressable
                  onPress={() => console.log("refactoring")}
                  className="flex-row items-center h-14 rounded-[14px] border-[1.5px] border-[#16181D] px-3.5 gap-3 active:opacity-80"
                >
                  <View className="w-8 h-8 rounded-full bg-[#16181D] items-center justify-center">
                    <Plus size={16} color="#FFFFFF" />
                  </View>
                  <VStack className="flex-1">
                    <Text className="text-[15px] font-heading text-[#16181D]">
                      Criar “{trimmedQuery}”
                    </Text>
                    <Text className="text-xs font-subtitle text-[#5A606B]">
                      Adicionar às suas emoções
                    </Text>
                  </VStack>
                  <CornerDownLeft size={18} color="#9AA0AA" />
                </Pressable>
              </VStack>
            )}

            {uncategorizedCustom.length > 0 && (
              <VStack className="mb-5" space="sm">
                <HStack className="justify-between items-end">
                  <Text className="text-[13px] font-subtitle-medium text-[#5A606B]">
                    Sem categoria
                  </Text>
                  <Text
                    className={`text-xs font-subtitle ${isSelectionMode
                      ? "text-destructive font-subtitle-medium"
                      : "text-[#9AA0AA]"
                      }`}
                  >
                    {isSelectionMode
                      ? `${deletingIds.length} selecionada(s)`
                      : "Segure para excluir"}
                  </Text>
                </HStack>
                <HStack className="flex-wrap gap-2">
                  {uncategorizedCustom.map((item) => {
                    const isSelected = emotions.some(
                      (e) =>
                        e.id === item.id ||
                        e.name.toLowerCase() === item.name.toLowerCase()
                    );
                    const isMarkedForDelete = deletingIds.includes(item.id);

                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => console.log("refactoring")}
                        onLongPress={() => console.log("refactoring")}
                        className={`flex-row items-center h-[34px] rounded-[10px] px-3 gap-1.5 border ${isMarkedForDelete
                          ? "bg-destructive/10 border-destructive"
                          : isSelected
                            ? "bg-[#E8F1FB] border-[#E8F1FB]"
                            : "bg-white border-[#E6E8EC]"
                          }`}
                      >
                        {isSelected && !isMarkedForDelete && (
                          <Check size={14} color="#1E4E8C" />
                        )}
                        <Text
                          className={`text-[14px] ${isMarkedForDelete
                            ? "text-destructive font-semibold"
                            : isSelected
                              ? "text-[#1E4E8C] font-semibold"
                              : "text-[#16181D] font-normal"
                            }`}
                        >
                          {item.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </HStack>
              </VStack>
            )}

            <VStack space="lg" className="pb-4">
              {categories.map((cat) => (
                <VStack key={cat.id} space="sm">
                  <HStack className="justify-between items-center">
                    <Text className="text-[13px] font-subtitle-medium text-[#5A606B]">
                      {cat.name}
                    </Text>
                    {cat.userId !== null && (
                      <HStack space="sm" className="items-center">
                        <Text className="text-xs font-subtitle text-[#9AA0AA]">
                          Criada por você
                        </Text>
                        <Pressable
                          onPress={() => console.log("refactoring")}
                          hitSlop={8}
                        >
                          <Trash2 size={14} color="#ef4444" />
                        </Pressable>
                      </HStack>
                    )}
                  </HStack>
                  <HStack className="flex-wrap gap-2">
                    {cat.emotions.map((item) => {
                      const isSelected = emotions.some(
                        (e) =>
                          (item.id !== undefined && e.id === item.id) ||
                          e.name.toLowerCase() === item.name.toLowerCase()
                      );
                      const isMarkedForDelete =
                        item.id !== undefined && deletingIds.includes(item.id);

                      return (
                        <Pressable
                          key={item.id}
                          onPress={() => console.log("refactoring")}
                          onLongPress={
                            item.userId !== null
                              ? () => console.log("refactoring")
                              : undefined
                          }
                          className={`flex-row items-center h-[34px] rounded-[10px] px-3 gap-1.5 border ${isMarkedForDelete
                            ? "bg-destructive/10 border-destructive"
                            : isSelected
                              ? "bg-[#E8F1FB] border-[#E8F1FB]"
                              : "bg-white border-[#E6E8EC]"
                            }`}
                        >
                          {isSelected && !isMarkedForDelete && (
                            <Check size={14} color="#1E4E8C" />
                          )}
                          <Text
                            className={`text-[14px] ${isMarkedForDelete
                              ? "text-destructive font-semibold"
                              : isSelected
                                ? "text-[#1E4E8C] font-semibold"
                                : "text-[#16181D] font-normal"
                              }`}
                          >
                            {item.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                    {cat.emotions.length === 0 && (
                      <Text className="text-xs text-[#9AA0AA] italic">
                        Nenhuma emoção nesta categoria ainda.
                      </Text>
                    )}
                  </HStack>
                </VStack>
              ))}
            </VStack>
          </DrawerBody>

          <DrawerFooter className="pt-2">
            {isSelectionMode ? (
              <HStack space="sm" className="w-full">
                <Button
                  variant="outline"
                  rounding="2xl"
                  className="flex-1 h-[52px]"
                  onPress={() => console.log("refactoring")}
                >
                  <ButtonText>Cancelar</ButtonText>
                </Button>
                <Button
                  variant="destructive"
                  rounding="2xl"
                  className="flex-1 h-[52px]"
                  onPress={() => console.log("refactoring")}
                >
                  <Trash2 size={16} color="#fafafa" />
                  <ButtonText>Excluir ({deletingIds.length})</ButtonText>
                </Button>
              </HStack>
            ) : (
              <Button
                rounding="2xl"
                className="w-full h-[52px] bg-[#16181D]"
                onPress={() => setOpen(false)}
              >
                <ButtonText className="text-[15px] font-semibold text-white">
                  {emotions.length === 0
                    ? "Concluir"
                    : emotions.length === 1
                      ? "Adicionar 1 emoção"
                      : `Adicionar ${emotions.length} emoções`}
                </ButtonText>
              </Button>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
