import { Check, FolderPlus, Footprints, Search, Trash2, X } from "lucide-react-native";
import NavButton from "@/components/common/nav-button";
import { Button, ButtonText } from "@/components/ui/button";
import { Drawer, DrawerBackdrop, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader } from "@/components/ui/drawer";
import { FormControl, FormControlError, FormControlErrorText } from "@/components/ui/form-control";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { getBehaviorIcon } from "@/lib/behavior-icons";
import { categoryCreateFormSchema } from "@/lib/db/zod/schemas/category/index.schema";
import { toggleSelectedId } from "@/lib/utils";
import { behaviorMutations, behaviorQueries } from "@/queries/behaviors/queries";
import { categoryMutations } from "@/queries/categories/queries";
import { useAuthStore } from "@/stores/auth-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function getBehaviorItemClasses(isSelected: boolean, isMarkedForDelete: boolean) {
  if (isMarkedForDelete) {
    return {
      button: "bg-destructive/10 border-destructive",
      text: "text-destructive font-semibold",
    };
  }
  if (isSelected) {
    return {
      button: "bg-blue-50 border-blue-50",
      text: "text-blue-900 font-semibold",
    };
  }
  return {
    button: "bg-white border-gray-200",
    text: "text-zinc-900 font-normal",
  };
}

interface Props {
  selectedIds: number[];
  onToggle: (id: number) => void;
  onRemove: (ids: number[]) => void;
}

export default function BehaviorsDrawer({ selectedIds: selectedBehaviors, onToggle: toggleBehavior, onRemove }: Props) {
  const { top, bottom } = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingIds, setDeletingIds] = useState<number[]>([]);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const userId = useAuthStore((s) => s.user!.id);
  const client = useQueryClient();
  const { data: behaviors = [] } = useQuery({ ...behaviorQueries.list(userId, searchQuery), enabled: open });
  const createCategory = useMutation(categoryMutations.create(client, userId));
  const deleteCategory = useMutation(categoryMutations.remove(client, userId));
  const deleteBehaviors = useMutation(behaviorMutations.remove(client, userId));
  const isSelectionMode = deletingIds.length > 0;
  const categoryForm = useForm<{ name: string }>({
    resolver: zodResolver(categoryCreateFormSchema),
    defaultValues: { name: "" },
  });

  const onSubmitCategory = (data: { name: string }) => {
    createCategory.mutate({ ...data, type: "behavior" }, {
      onSuccess: () => {
        categoryForm.reset({ name: "" });
        setShowCategoryForm(false);
      },
    });
  };

  const toggleDeleteId = (behaviorId: number) => {
    setDeletingIds(ids => toggleSelectedId(ids, behaviorId));
  };

  const handleBehaviorPress = (behaviorId: number) => {
    if (isSelectionMode) {
      toggleDeleteId(behaviorId);
    } else {
      toggleBehavior(behaviorId);
    }
  };

  const handleDeleteSelected = () => {
    deleteBehaviors.mutate(deletingIds, {
      onSuccess: (_data, ids) => {
        onRemove(ids);
        setDeletingIds([]);
      },
    });
  };

  const handleOpen = () => {
    setSearchQuery("");
    setDeletingIds([]);
    setShowCategoryForm(false);
    categoryForm.reset({ name: "" });
    setOpen(true);
  };

  return (
    <>
      <NavButton Icon={Footprints} badge={selectedBehaviors.length} onPress={handleOpen}>
        Comportamento
      </NavButton>
      <Drawer isOpen={open} onClose={() => setOpen(false)} size="full" anchor="bottom">
        <DrawerBackdrop />
        <DrawerContent
          className="h-full rounded-none px-6 bg-white"
          style={{ paddingTop: top + 12, paddingBottom: bottom + 16 }}
        >
          <DrawerHeader className="pb-4 flex-row items-center gap-3">
            <DrawerCloseButton className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center p-0 active:opacity-75">
              <X size={18} color="#16181D" />
            </DrawerCloseButton>
            <VStack space="xs" className="flex-1">
              <Text className="text-lg font-heading text-zinc-900">
                O que você fez naquela hora?
              </Text>
              <Text className="text-xs font-subtitle text-zinc-600">
                Registre suas ações e comportamentos
              </Text>
            </VStack>
          </DrawerHeader>
          <Input className="h-11 rounded-xl bg-gray-100 border-transparent data-[focus=true]:bg-white data-[focus=true]:border-zinc-900 shadow-none px-3.5 mb-2.5">
            <Search size={18} color="#9AA0AA" />
            <InputField
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar comportamento..."
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
                <X size={16} color="#9AA0AA" />
              </Pressable>
            )}
          </Input>
          <Button
            variant="outline"
            rounding="xl"
            className="h-10 mb-2"
            onPress={() => setShowCategoryForm(show => !show)}
          >
            <FolderPlus size={15} color="#16181D" />
            <ButtonText>Nova categoria</ButtonText>
          </Button>
          {showCategoryForm && (
            <VStack space="sm" className="mb-3 p-3.5 rounded-xl bg-gray-100 border border-gray-200">
              <Controller
                control={categoryForm.control}
                name="name"
                render={({ field, fieldState }) => (
                  <FormControl isInvalid={Boolean(fieldState.error)}>
                    <HStack space="sm" className="items-center">
                      <Input className="flex-1 h-10 rounded-lg bg-white border-gray-200 shadow-none px-3">
                        <InputField
                          value={field.value}
                          onChangeText={field.onChange}
                          onBlur={field.onBlur}
                          placeholder="Nome da nova categoria..."
                          maxLength={30}
                          autoFocus
                          returnKeyType="done"
                          onSubmitEditing={categoryForm.handleSubmit(onSubmitCategory)}
                        />
                      </Input>
                      <Button
                        size="sm"
                        rounding="lg"
                        className="h-10 px-4 bg-zinc-900"
                        disabled={createCategory.isPending}
                        onPress={categoryForm.handleSubmit(onSubmitCategory)}
                      >
                        <ButtonText>Criar</ButtonText>
                      </Button>
                    </HStack>
                    <FormControlError>
                      <FormControlErrorText>{fieldState.error?.message}</FormControlErrorText>
                    </FormControlError>
                  </FormControl>
                )}
              />
            </VStack>
          )}
          <DrawerBody className="flex-1 mt-2 mb-2" showsVerticalScrollIndicator={false}>
            <VStack space="lg" className="pb-4">
              {behaviors.map(category => (
                <VStack key={category.id} space="sm">
                  <HStack className="justify-between items-center">
                    <Text className="text-sm font-subtitle-medium text-zinc-600">
                      {category.name}
                    </Text>
                    {category.userId !== null && (
                      <Pressable onPress={() => deleteCategory.mutate(category.id)} hitSlop={8}>
                        <Trash2 size={14} color="#ef4444" />
                      </Pressable>
                    )}
                  </HStack>
                  <HStack className="flex-wrap gap-2">
                    {category.behaviors.map(item => {
                      const isSelected = selectedBehaviors.includes(item.id);
                      const isMarkedForDelete = deletingIds.includes(item.id);
                      const isDisabled = isSelectionMode && item.userId === null;
                      const itemClasses = getBehaviorItemClasses(isSelected, isMarkedForDelete);
                      const IconComponent = getBehaviorIcon(item.icon);
                      return (
                        <Pressable
                          key={item.id}
                          disabled={isDisabled}
                          onPress={() => handleBehaviorPress(item.id)}
                          onLongPress={item.userId !== null ? () => toggleDeleteId(item.id) : undefined}
                          className={`flex-row items-center h-8.5 rounded-lg px-3 gap-1.5 border ${itemClasses.button} ${isDisabled ? "opacity-40" : ""}`}
                        >
                          {isSelected && !isMarkedForDelete
                            ? <Check size={14} color="#1E4E8C" />
                            : <IconComponent size={14} color="#5A606B" />}
                          <Text className={`text-sm ${itemClasses.text}`}>
                            {item.content}
                          </Text>
                        </Pressable>
                      );
                    })}
                    {category.behaviors.length === 0 && (
                      <Text className="text-xs text-zinc-400 italic">
                        Nenhum comportamento nesta categoria ainda.
                      </Text>
                    )}
                  </HStack>
                </VStack>
              ))}
              {behaviors.length === 0 && (
                <Text className="text-sm font-subtitle text-zinc-600">
                  Nenhum comportamento encontrado.
                </Text>
              )}
            </VStack>
          </DrawerBody>
          <DrawerFooter className="pt-2">
            {isSelectionMode && (
              <HStack space="sm" className="w-full">
                <Button variant="outline" rounding="2xl" className="flex-1 h-13" onPress={() => setDeletingIds([])}>
                  <ButtonText>Cancelar</ButtonText>
                </Button>
                <Button variant="destructive" rounding="2xl" className="flex-1 h-13" onPress={handleDeleteSelected}>
                  <Trash2 size={16} color="#fafafa" />
                  <ButtonText>Excluir ({deletingIds.length})</ButtonText>
                </Button>
              </HStack>
            )}
            {!isSelectionMode && (
              <Button rounding="2xl" className="w-full h-13 bg-zinc-900" onPress={() => setOpen(false)}>
                <ButtonText className="text-base font-semibold text-white">
                  {selectedBehaviors.length === 0 && "Concluir"}
                  {selectedBehaviors.length > 0 &&
                    `Adicionar ${selectedBehaviors.length} comportamento${selectedBehaviors.length === 1 ? "" : "s"}`}
                </ButtonText>
              </Button>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
