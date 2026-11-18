import { Activity, Check, FolderPlus, Search, Trash2, X } from "lucide-react-native";
import NavButton from "@/components/common/nav-button";
import { Button, ButtonText } from "@/components/ui/button";
import { Drawer, DrawerBackdrop, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader } from "@/components/ui/drawer";
import { FormControl, FormControlError, FormControlErrorText } from "@/components/ui/form-control";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { categoryCreateFormSchema } from "@/lib/db/zod/schemas/category/index.schema";
import { toggleSelectedId } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useCategoryStore } from "@/stores/category-store";
import { useReactionStore } from "@/stores/reaction-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function getReactionItemClasses(isSelected: boolean, isMarkedForDelete: boolean) {
  if (isMarkedForDelete) {
    return {
      button: "bg-destructive/10 border-destructive",
      text: "text-destructive font-semibold",
    };
  }
  if (isSelected) {
    return {
      button: "bg-amber-50 border-amber-50",
      text: "text-amber-800 font-semibold",
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

export default function ReactionsDrawer({ selectedIds: selectedReactions, onToggle: toggleReaction, onRemove }: Props) {
  const { top, bottom } = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingIds, setDeletingIds] = useState<number[]>([]);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const userId = useAuthStore((s) => s.user!.id);
  const reactions = useReactionStore((s) => s.reactions);
  const searchReactions = useReactionStore((s) => s.searchReactions);
  const loadReactions = useReactionStore((s) => s.loadReactions);
  const deleteReactions = useReactionStore((s) => s.deleteReactions);
  const addCategory = useCategoryStore((s) => s.addCategory);
  const deleteCategory = useCategoryStore((s) => s.deleteCategory);
  const isSelectionMode = deletingIds.length > 0;
  const categoryForm = useForm<{ name: string }>({
    resolver: zodResolver(categoryCreateFormSchema),
    defaultValues: { name: "" },
  });

  const onSubmitCategory = async (data: { name: string }) => {
    const category = await addCategory({ ...data, userId, type: "reaction" });
    if (!category) return;
    categoryForm.reset({ name: "" });
    setShowCategoryForm(false);
    await searchReactions(searchQuery, { userId });
  };

  const handleDeleteCategory = async (categoryId: number) => {
    const deleted = await deleteCategory(categoryId);
    if (!deleted) return;
    await searchReactions(searchQuery, { userId });
  };

  const toggleDeleteId = (reactionId: number) => {
    setDeletingIds(ids => toggleSelectedId(ids, reactionId));
  };

  const handleReactionPress = (reactionId: number) => {
    if (isSelectionMode) {
      toggleDeleteId(reactionId);
    } else {
      toggleReaction(reactionId);
    }
  };

  const handleDeleteSelected = async () => {
    const deleted = deleteReactions(deletingIds, userId);
    if (!deleted) return;
    onRemove(deletingIds);
    setDeletingIds([]);
    await searchReactions(searchQuery, { userId });
  };

  const handleOpen = () => {
    setSearchQuery("");
    setDeletingIds([]);
    setShowCategoryForm(false);
    categoryForm.reset({ name: "" });
    setOpen(true);
    loadReactions(userId);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    searchReactions(query, { userId });
  };

  return (
    <>
      <NavButton Icon={Activity} badge={selectedReactions.length} onPress={handleOpen}>
        Reações
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
              <Text className="text-[18px] font-heading text-zinc-900">
                Reações e sensações
              </Text>
              <Text className="text-xs font-subtitle text-zinc-600">
                Registre sensações físicas ou reações do momento
              </Text>
            </VStack>
          </DrawerHeader>
          <Input className="h-11 rounded-xl bg-gray-100 border-transparent data-[focus=true]:bg-white data-[focus=true]:border-zinc-900 shadow-none px-3.5 mb-2.5">
            <Search size={18} color="#9AA0AA" />
            <InputField
              value={searchQuery}
              onChangeText={handleSearch}
              placeholder="Buscar reação corporal..."
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => handleSearch("")} hitSlop={8}>
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
                        disabled={categoryForm.formState.isSubmitting}
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
              {reactions.map(category => (
                <VStack key={category.id} space="sm">
                  <HStack className="justify-between items-center">
                    <Text className="text-[13px] font-subtitle-medium text-zinc-600">
                      {category.name}
                    </Text>
                    {category.userId !== null && (
                      <Pressable onPress={() => handleDeleteCategory(category.id)} hitSlop={8}>
                        <Trash2 size={14} color="#ef4444" />
                      </Pressable>
                    )}
                  </HStack>
                  <HStack className="flex-wrap gap-2">
                    {category.reactions.map(item => {
                      const isSelected = selectedReactions.includes(item.id);
                      const isMarkedForDelete = deletingIds.includes(item.id);
                      const isDisabled = isSelectionMode && item.userId === null;
                      const itemClasses = getReactionItemClasses(isSelected, isMarkedForDelete);
                      return (
                        <Pressable
                          key={item.id}
                          disabled={isDisabled}
                          onPress={() => handleReactionPress(item.id)}
                          onLongPress={item.userId !== null ? () => toggleDeleteId(item.id) : undefined}
                          className={`flex-row items-center h-[34px] rounded-[10px] px-3 gap-1.5 border ${itemClasses.button} ${isDisabled ? "opacity-40" : ""}`}
                        >
                          {isSelected && !isMarkedForDelete && <Check size={14} color="#8A5A12" />}
                          <Text className={`text-[14px] ${itemClasses.text}`}>
                            {item.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                    {category.reactions.length === 0 && (
                      <Text className="text-xs text-zinc-400 italic">
                        Nenhuma reação nesta categoria ainda.
                      </Text>
                    )}
                  </HStack>
                </VStack>
              ))}
              {reactions.length === 0 && (
                <Text className="text-sm font-subtitle text-zinc-600">
                  Nenhuma reação encontrada.
                </Text>
              )}
            </VStack>
          </DrawerBody>
          <DrawerFooter className="pt-2">
            {isSelectionMode && (
              <HStack space="sm" className="w-full">
                <Button variant="outline" rounding="2xl" className="flex-1 h-[52px]" onPress={() => setDeletingIds([])}>
                  <ButtonText>Cancelar</ButtonText>
                </Button>
                <Button variant="destructive" rounding="2xl" className="flex-1 h-[52px]" onPress={handleDeleteSelected}>
                  <Trash2 size={16} color="#fafafa" />
                  <ButtonText>Excluir ({deletingIds.length})</ButtonText>
                </Button>
              </HStack>
            )}
            {!isSelectionMode && (
              <Button rounding="2xl" className="w-full h-[52px] bg-zinc-900" onPress={() => setOpen(false)}>
                <ButtonText className="text-[15px] font-semibold text-white">
                  {selectedReactions.length === 0 && "Concluir"}
                  {selectedReactions.length > 0 &&
                    `Adicionar ${selectedReactions.length} ${selectedReactions.length === 1 ? "reação" : "reações"}`}
                </ButtonText>
              </Button>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
  // const { top, bottom } = useSafeAreaInsets();
  // const [open, setOpen] = useState(false);
  // const [activeForm, setActiveForm] = useState<ActiveForm>("none");
  // const [customItems, setCustomItems] = useState<ResourceItem[]>([]);
  // const [userCategories, setUserCategories] = useState<Category[]>([]);
  // const [searchQuery, setSearchQuery] = useState("");
  // const [deletingIds, setDeletingIds] = useState<number[]>([]);
  //
  // const user = useAuthStore((s) => s.user);
  // const reactions = useComposer((s) => s.reactions);
  // const toggleReaction = useComposer((s) => s.toggleReaction);
  // const removeReactions = useComposer((s) => s.removeReactions);
  //
  // const itemForm = useForm<CreateReactionFormSchema>({
  //   resolver: zodResolver(createReactionFormSchema),
  //   defaultValues: {
  //     name: "",
  //     categoryName: defaultReactions[0]?.name ?? null,
  //   },
  // });
  //
  // const categoryForm = useForm<CreateCategoryFormSchema>({
  //   resolver: zodResolver(createCategoryFormSchema),
  //   defaultValues: {
  //     name: "",
  //   },
  // });
  //
  // const loadCustom = async () => {
  //   const [items, cats] = await Promise.all([
  //     getUserResources("reaction", user?.id),
  //     getUserCategories("reaction", user?.id),
  //   ]);
  //   setCustomItems(items);
  //   setUserCategories(cats);
  // };
  //
  // const handleOpen = async () => {
  //   setDeletingIds([]);
  //   setSearchQuery("");
  //   setActiveForm("none");
  //   itemForm.reset({
  //     name: "",
  //     categoryName: defaultReactions[0]?.name ?? null,
  //   });
  //   categoryForm.reset({ name: "" });
  //   setOpen(true);
  //   await loadCustom();
  // };
  //
  // const toggleForm = (target: ActiveForm) => {
  //   setActiveForm((prev) => (prev === target ? "none" : target));
  // };
  //
  // const onSubmitItem = async (data: CreateReactionFormSchema) => {
  //   const created = await createResourceItem(
  //     "reaction",
  //     data.name,
  //     data.categoryName ?? null,
  //     user?.id
  //   );
  //   setCustomItems((prev) => [...prev, created]);
  //   toggleReaction({ id: created.id, name: created.name });
  //   itemForm.reset({
  //     name: "",
  //     categoryName: data.categoryName ?? defaultReactions[0]?.name ?? null,
  //   });
  //   setActiveForm("none");
  // };
  //
  // const onSubmitCategory = async (data: CreateCategoryFormSchema) => {
  //   const createdCat = await createCategoryItem("reaction", data.name, user?.id);
  //   setUserCategories((prev) => [...prev, createdCat]);
  //   itemForm.setValue("categoryName", createdCat.name);
  //   categoryForm.reset({ name: "" });
  //   setActiveForm("none");
  // };
  //
  // const handleInstantCreate = async (rawName: string) => {
  //   const parsed = createReactionFormSchema.safeParse({
  //     name: rawName,
  //     categoryName: null,
  //   });
  //   if (!parsed.success) return;
  //   const created = await createResourceItem(
  //     "reaction",
  //     parsed.data.name,
  //     null,
  //     user?.id
  //   );
  //   setCustomItems((prev) => [...prev, created]);
  //   toggleReaction({ id: created.id, name: created.name });
  //   setSearchQuery("");
  // };
  //
  // const handleDeleteCategory = async (categoryId: number) => {
  //   await deleteCategoryItem(categoryId);
  //   await loadCustom();
  // };
  //
  // const toggleDeleteId = (id: number) => {
  //   setDeletingIds((prev) =>
  //     prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
  //   );
  // };
  //
  // const handleDeleteSelected = async () => {
  //   if (deletingIds.length === 0) return;
  //   await deleteResourceItems("reaction", deletingIds);
  //   removeReactions(deletingIds);
  //   setDeletingIds([]);
  //   await loadCustom();
  // };
  //
  // const allCategoryNames = [
  //   ...defaultReactions.map((c) => c.name),
  //   ...userCategories
  //     .map((c) => c.name)
  //     .filter(
  //       (name) =>
  //         !defaultReactions.some(
  //           (d) => d.name.toLowerCase() === name.toLowerCase()
  //         )
  //     ),
  // ];
  //
  // const trimmedQuery = searchQuery.trim();
  // const normalizedQuery = trimmedQuery.toLowerCase();
  //
  // const uncategorizedCustom = customItems
  //   .filter(
  //     (item) =>
  //       !item.categoryName ||
  //       !allCategoryNames.some(
  //         (catName) => catName.toLowerCase() === item.categoryName?.toLowerCase()
  //       )
  //   )
  //   .filter((item) =>
  //     !normalizedQuery
  //       ? true
  //       : item.name.toLowerCase().includes(normalizedQuery)
  //   );
  //
  // const combinedCategories = allCategoryNames
  //   .map((catName) => {
  //     const defaultCat = defaultReactions.find(
  //       (d) => d.name.toLowerCase() === catName.toLowerCase()
  //     );
  //     const userCat = userCategories.find(
  //       (u) => u.name.toLowerCase() === catName.toLowerCase()
  //     );
  //
  //     const jsonItems = (defaultCat?.items ?? [])
  //       .filter((item) =>
  //         !normalizedQuery
  //           ? true
  //           : item.name.toLowerCase().includes(normalizedQuery)
  //       )
  //       .map((item) => ({
  //         id: undefined as number | undefined,
  //         name: item.name,
  //         isCustom: false,
  //       }));
  //
  //     const catCustomItems = customItems
  //       .filter(
  //         (item) =>
  //           item.categoryName?.toLowerCase() === catName.toLowerCase()
  //       )
  //       .filter((item) =>
  //         !normalizedQuery
  //           ? true
  //           : item.name.toLowerCase().includes(normalizedQuery)
  //       )
  //       .map((item) => ({
  //         id: item.id,
  //         name: item.name,
  //         isCustom: true,
  //       }));
  //
  //     return {
  //       name: catName,
  //       userCategoryId: defaultCat ? undefined : userCat?.id,
  //       isUserCreated: !defaultCat && Boolean(userCat),
  //       items: [...jsonItems, ...catCustomItems],
  //     };
  //   })
  //   .filter(
  //     (cat) =>
  //       cat.items.length > 0 || (!normalizedQuery && cat.isUserCreated)
  //   );
  //
  // const exactMatchExists =
  //   customItems.some((i) => i.name.toLowerCase() === normalizedQuery) ||
  //   defaultReactions.some((cat) =>
  //     cat.items.some((i) => i.name.toLowerCase() === normalizedQuery)
  //   );
  //
  // const hasAnyMatch =
  //   uncategorizedCustom.length > 0 ||
  //   combinedCategories.some((c) => c.items.length > 0);
  //
  // const isSelectionMode = deletingIds.length > 0;
  //
  // return (
  //   <>
  //     <Drawer
  //       isOpen={open}
  //       onClose={() => {
  //         setDeletingIds([]);
  //         setSearchQuery("");
  //         setActiveForm("none");
  //         setOpen(false);
  //       }}
  //       size="full"
  //       anchor="bottom"
  //     >
  //       <DrawerBackdrop />
  //       <DrawerContent
  //         className="h-full rounded-none px-6 bg-white"
  //         style={{ paddingTop: top + 12, paddingBottom: bottom + 16 }}
  //       >
  //         <DrawerHeader className="pb-4 flex-row items-center gap-3">
  //           <DrawerCloseButton className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center p-0 active:opacity-75">
  //             <X size={18} color="#16181D" />
  //           </DrawerCloseButton>
  //           <VStack space="xs" className="flex-1">
  //             <Text className="text-[18px] font-heading text-zinc-900">
  //               Reações e sensações
  //             </Text>
  //             <Text className="text-xs font-subtitle text-zinc-600">
  //               Registre sensações físicas ou reações do momento
  //             </Text>
  //           </VStack>
  //         </DrawerHeader>
  //
  //         <Input className="h-11 rounded-xl bg-gray-100 border-transparent data-[focus=true]:bg-white data-[focus=true]:border-zinc-900 shadow-none px-3.5 mb-2.5">
  //           <Search size={18} color="#9AA0AA" />
  //           <InputField
  //             value={searchQuery}
  //             onChangeText={setSearchQuery}
  //             placeholder="Buscar reação corporal..."
  //             returnKeyType="search"
  //           />
  //           {searchQuery.length > 0 && (
  //             <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
  //               <X size={16} color="#9AA0AA" />
  //             </Pressable>
  //           )}
  //         </Input>
  //
  //         <HStack space="sm" className="mb-2">
  //           <Pressable
  //             onPress={() => toggleForm("item")}
  //             className={`flex-1 h-10 rounded-xl flex-row items-center justify-center gap-1.5 border ${
  //               activeForm === "item"
  //                 ? "bg-zinc-900 border-zinc-900"
  //                 : "bg-white border-gray-200"
  //             }`}
  //           >
  //             <Plus
  //               size={15}
  //               color={activeForm === "item" ? "#FFFFFF" : "#16181D"}
  //             />
  //             <Text
  //               className={`text-xs font-semibold ${
  //                 activeForm === "item" ? "text-white" : "text-zinc-900"
  //               }`}
  //             >
  //               Nova reação
  //             </Text>
  //           </Pressable>
  //
  //           <Pressable
  //             onPress={() => toggleForm("category")}
  //             className={`flex-1 h-10 rounded-xl flex-row items-center justify-center gap-1.5 border ${
  //               activeForm === "category"
  //                 ? "bg-zinc-900 border-zinc-900"
  //                 : "bg-white border-gray-200"
  //             }`}
  //           >
  //             <FolderPlus
  //               size={15}
  //               color={activeForm === "category" ? "#FFFFFF" : "#16181D"}
  //             />
  //             <Text
  //               className={`text-xs font-semibold ${
  //                 activeForm === "category" ? "text-white" : "text-zinc-900"
  //               }`}
  //             >
  //               Nova categoria
  //             </Text>
  //           </Pressable>
  //         </HStack>
  //
  //         {activeForm === "item" && (
  //           <VStack
  //             space="sm"
  //             className="mb-3 p-3.5 rounded-xl bg-gray-100 border border-gray-200"
  //           >
  //             <Controller
  //               control={itemForm.control}
  //               name="name"
  //               render={({ field, fieldState }) => (
  //                 <FormControl isInvalid={Boolean(fieldState.error)}>
  //                   <HStack space="sm" className="items-center">
  //                     <Input className="flex-1 h-10 rounded-lg bg-white border-gray-200 shadow-none px-3">
  //                       <InputField
  //                         value={field.value}
  //                         onChangeText={field.onChange}
  //                         onBlur={field.onBlur}
  //                         placeholder="Nome da nova reação..."
  //                         maxLength={40}
  //                         autoFocus
  //                         returnKeyType="done"
  //                         onSubmitEditing={itemForm.handleSubmit(onSubmitItem)}
  //                       />
  //                     </Input>
  //                     <Button
  //                       size="sm"
  //                       rounding="lg"
  //                       className="h-10 px-4 bg-zinc-900"
  //                       disabled={itemForm.formState.isSubmitting}
  //                       onPress={itemForm.handleSubmit(onSubmitItem)}
  //                     >
  //                       <ButtonText>Criar</ButtonText>
  //                     </Button>
  //                   </HStack>
  //                   <FormControlError>
  //                     <FormControlErrorText>
  //                       {fieldState.error?.message}
  //                     </FormControlErrorText>
  //                   </FormControlError>
  //                 </FormControl>
  //               )}
  //             />
  //
  //             <Controller
  //               control={itemForm.control}
  //               name="categoryName"
  //               render={({ field }) => (
  //                 <VStack space="xs">
  //                   <Text className="text-xs font-subtitle-medium text-zinc-600">
  //                     Categoria (opcional):
  //                   </Text>
  //                   <HStack className="flex-wrap gap-1.5">
  //                     {allCategoryNames.map((catName) => {
  //                       const isSelected = field.value === catName;
  //                       return (
  //                         <Pressable
  //                           key={catName}
  //                           onPress={() =>
  //                             field.onChange(isSelected ? null : catName)
  //                           }
  //                           className={`flex-row items-center h-7 rounded-lg px-2.5 gap-1 border ${
  //                             isSelected
  //                               ? "bg-amber-50 border-amber-800"
  //                               : "bg-white border-gray-200"
  //                           }`}
  //                         >
  //                           {isSelected && <Check size={12} color="#8A5A12" />}
  //                           <Text
  //                             className={`text-xs ${
  //                               isSelected
  //                                 ? "text-amber-800 font-semibold"
  //                                 : "text-zinc-900"
  //                             }`}
  //                           >
  //                             {catName}
  //                           </Text>
  //                         </Pressable>
  //                       );
  //                     })}
  //                   </HStack>
  //                 </VStack>
  //               )}
  //             />
  //           </VStack>
  //         )}
  //
  //         {activeForm === "category" && (
  //           <VStack
  //             space="sm"
  //             className="mb-3 p-3.5 rounded-xl bg-gray-100 border border-gray-200"
  //           >
  //             <Controller
  //               control={categoryForm.control}
  //               name="name"
  //               render={({ field, fieldState }) => (
  //                 <FormControl isInvalid={Boolean(fieldState.error)}>
  //                   <HStack space="sm" className="items-center">
  //                     <Input className="flex-1 h-10 rounded-lg bg-white border-gray-200 shadow-none px-3">
  //                       <InputField
  //                         value={field.value}
  //                         onChangeText={field.onChange}
  //                         onBlur={field.onBlur}
  //                         placeholder="Nome da nova categoria..."
  //                         maxLength={30}
  //                         autoFocus
  //                         returnKeyType="done"
  //                         onSubmitEditing={categoryForm.handleSubmit(
  //                           onSubmitCategory
  //                         )}
  //                       />
  //                     </Input>
  //                     <Button
  //                       size="sm"
  //                       rounding="lg"
  //                       className="h-10 px-4 bg-zinc-900"
  //                       disabled={categoryForm.formState.isSubmitting}
  //                       onPress={categoryForm.handleSubmit(onSubmitCategory)}
  //                     >
  //                       <ButtonText>Criar</ButtonText>
  //                     </Button>
  //                   </HStack>
  //                   <FormControlError>
  //                     <FormControlErrorText>
  //                       {fieldState.error?.message}
  //                     </FormControlErrorText>
  //                   </FormControlError>
  //                 </FormControl>
  //               )}
  //             />
  //           </VStack>
  //         )}
  //
  //         <DrawerBody
  //           className="flex-1 mt-2 mb-2"
  //           showsVerticalScrollIndicator={false}
  //         >
  //           {trimmedQuery.length > 0 && !exactMatchExists && (
  //             <VStack space="sm" className="mb-5">
  //               {!hasAnyMatch && (
  //                 <Text className="text-sm font-subtitle text-zinc-600">
  //                   Nenhuma reação com esse nome ainda.
  //                 </Text>
  //               )}
  //               <Pressable
  //                 onPress={() => handleInstantCreate(trimmedQuery)}
  //                 className="flex-row items-center h-14 rounded-[14px] border-[1.5px] border-zinc-900 px-3.5 gap-3 active:opacity-80"
  //               >
  //                 <View className="w-8 h-8 rounded-full bg-zinc-900 items-center justify-center">
  //                   <Plus size={16} color="#FFFFFF" />
  //                 </View>
  //                 <VStack className="flex-1">
  //                   <Text className="text-[15px] font-heading text-zinc-900">
  //                     Criar “{trimmedQuery}”
  //                   </Text>
  //                   <Text className="text-xs font-subtitle text-zinc-600">
  //                     Adicionar às suas reações
  //                   </Text>
  //                 </VStack>
  //                 <CornerDownLeft size={18} color="#9AA0AA" />
  //               </Pressable>
  //             </VStack>
  //           )}
  //
  //           {uncategorizedCustom.length > 0 && (
  //             <VStack className="mb-5" space="sm">
  //               <HStack className="justify-between items-end">
  //                 <Text className="text-[13px] font-subtitle-medium text-zinc-600">
  //                   Sem categoria
  //                 </Text>
  //                 <Text
  //                   className={`text-xs font-subtitle ${
  //                     isSelectionMode
  //                       ? "text-destructive font-subtitle-medium"
  //                       : "text-zinc-400"
  //                   }`}
  //                 >
  //                   {isSelectionMode
  //                     ? `${deletingIds.length} selecionada(s)`
  //                     : "Segure para excluir"}
  //                 </Text>
  //               </HStack>
  //               <HStack className="flex-wrap gap-2">
  //                 {uncategorizedCustom.map((item) => {
  //                   const isSelected = reactions.some(
  //                     (r) =>
  //                       r.id === item.id ||
  //                       r.name.toLowerCase() === item.name.toLowerCase()
  //                   );
  //                   const isMarkedForDelete = deletingIds.includes(item.id);
  //
  //                   return (
  //                     <Pressable
  //                       key={item.id}
  //                       onPress={() => {
  //                         if (isSelectionMode) {
  //                           toggleDeleteId(item.id);
  //                         } else {
  //                           toggleReaction({
  //                             id: item.id,
  //                             name: item.name,
  //                           });
  //                         }
  //                       }}
  //                       onLongPress={() => toggleDeleteId(item.id)}
  //                       className={`flex-row items-center h-[34px] rounded-[10px] px-3 gap-1.5 border ${
  //                         isMarkedForDelete
  //                           ? "bg-destructive/10 border-destructive"
  //                           : isSelected
  //                             ? "bg-amber-50 border-amber-50"
  //                             : "bg-white border-gray-200"
  //                       }`}
  //                     >
  //                       {isSelected && !isMarkedForDelete && (
  //                         <Check size={14} color="#8A5A12" />
  //                       )}
  //                       <Text
  //                         className={`text-[14px] ${
  //                           isMarkedForDelete
  //                             ? "text-destructive font-semibold"
  //                             : isSelected
  //                               ? "text-amber-800 font-semibold"
  //                               : "text-zinc-900 font-normal"
  //                         }`}
  //                       >
  //                         {item.name}
  //                       </Text>
  //                     </Pressable>
  //                   );
  //                 })}
  //               </HStack>
  //             </VStack>
  //           )}
  //
  //           <VStack space="lg" className="pb-4">
  //             {combinedCategories.map((cat) => (
  //               <VStack key={cat.name} space="sm">
  //                 <HStack className="justify-between items-center">
  //                   <Text className="text-[13px] font-subtitle-medium text-zinc-600">
  //                     {cat.name}
  //                   </Text>
  //                   {cat.isUserCreated && (
  //                     <HStack space="sm" className="items-center">
  //                       <Text className="text-xs font-subtitle text-zinc-400">
  //                         Criada por você
  //                       </Text>
  //                       {cat.userCategoryId !== undefined && (
  //                         <Pressable
  //                           onPress={() =>
  //                             handleDeleteCategory(cat.userCategoryId!)
  //                           }
  //                           hitSlop={8}
  //                         >
  //                           <Trash2 size={14} color="#ef4444" />
  //                         </Pressable>
  //                       )}
  //                     </HStack>
  //                   )}
  //                 </HStack>
  //                 <HStack className="flex-wrap gap-2">
  //                   {cat.items.map((item) => {
  //                     const isSelected = reactions.some(
  //                       (r) =>
  //                         (item.id !== undefined && r.id === item.id) ||
  //                         r.name.toLowerCase() === item.name.toLowerCase()
  //                     );
  //                     const isMarkedForDelete =
  //                       item.id !== undefined && deletingIds.includes(item.id);
  //
  //                     return (
  //                       <Pressable
  //                         key={item.id ? `c-${item.id}` : `d-${item.name}`}
  //                         onPress={() => {
  //                           if (isSelectionMode && item.id !== undefined) {
  //                             toggleDeleteId(item.id);
  //                           } else if (!isSelectionMode) {
  //                             toggleReaction(
  //                               item.id !== undefined
  //                                 ? { id: item.id, name: item.name }
  //                                 : { name: item.name }
  //                             );
  //                           }
  //                         }}
  //                         onLongPress={
  //                           item.isCustom && item.id !== undefined
  //                             ? () => toggleDeleteId(item.id!)
  //                             : undefined
  //                         }
  //                         className={`flex-row items-center h-[34px] rounded-[10px] px-3 gap-1.5 border ${
  //                           isMarkedForDelete
  //                             ? "bg-destructive/10 border-destructive"
  //                             : isSelected
  //                               ? "bg-amber-50 border-amber-50"
  //                               : "bg-white border-gray-200"
  //                         }`}
  //                       >
  //                         {isSelected && !isMarkedForDelete && (
  //                           <Check size={14} color="#8A5A12" />
  //                         )}
  //                         <Text
  //                           className={`text-[14px] ${
  //                             isMarkedForDelete
  //                               ? "text-destructive font-semibold"
  //                               : isSelected
  //                                 ? "text-amber-800 font-semibold"
  //                                 : "text-zinc-900 font-normal"
  //                           }`}
  //                         >
  //                           {item.name}
  //                         </Text>
  //                       </Pressable>
  //                     );
  //                   })}
  //                   {cat.items.length === 0 && (
  //                     <Text className="text-xs text-zinc-400 italic">
  //                       Nenhuma reação nesta categoria ainda.
  //                     </Text>
  //                   )}
  //                 </HStack>
  //               </VStack>
  //             ))}
  //           </VStack>
  //         </DrawerBody>
  //
  //         <DrawerFooter className="pt-2">
  //           {isSelectionMode ? (
  //             <HStack space="sm" className="w-full">
  //               <Button
  //                 variant="outline"
  //                 rounding="2xl"
  //                 className="flex-1 h-[52px]"
  //                 onPress={() => setDeletingIds([])}
  //               >
  //                 <ButtonText>Cancelar</ButtonText>
  //               </Button>
  //               <Button
  //                 variant="destructive"
  //                 rounding="2xl"
  //                 className="flex-1 h-[52px]"
  //                 onPress={handleDeleteSelected}
  //               >
  //                 <Trash2 size={16} color="#fafafa" />
  //                 <ButtonText>Excluir ({deletingIds.length})</ButtonText>
  //               </Button>
  //             </HStack>
  //           ) : (
  //             <Button
  //               rounding="2xl"
  //               className="w-full h-[52px] bg-zinc-900"
  //               onPress={() => setOpen(false)}
  //             >
  //               <ButtonText className="text-[15px] font-semibold text-white">
  //                 {reactions.length === 0
  //                   ? "Concluir"
  //                   : reactions.length === 1
  //                     ? "Adicionar 1 reação"
  //                     : `Adicionar ${reactions.length} reações`}
  //               </ButtonText>
  //             </Button>
  //           )}
  //         </DrawerFooter>
  //       </DrawerContent>
  //     </Drawer>
  //   </>
  // );
}
