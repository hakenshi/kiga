import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  CornerDownLeft,
  FolderPlus,
  Footprints,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react-native";
import NavButton from "@/components/common/nav-button";
import { EntryTextInput } from "@/components/entry-text-input";
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
import {
  AVAILABLE_BEHAVIOR_ICONS,
  getBehaviorIcon,
} from "@/lib/behavior-icons";
import defaultBehaviors from "@/lib/data/behaviors.json";
import {
  createBehavior,
  deleteBehaviors,
  getUserBehaviors,
} from "@/repositories/behavior-repository";
import {
  createCategoryItem,
  deleteCategoryItem,
  getUserCategories,
} from "@/repositories/resource-repository";
import {
  createBehaviorFormSchema,
  createCategoryFormSchema,
} from "@/lib/db/zod/zod-schemas";
import { useAuthStore } from "@/stores/auth-store";
import { useComposer } from "../composer-context";

type ActiveForm = "none" | "item" | "category";

export default function BehaviorsDrawer() {
  const { top, bottom } = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [activeForm, setActiveForm] = useState<ActiveForm>("none");
  const [customItems, setCustomItems] = useState<BehaviorItem[]>([]);
  const [userCategories, setUserCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingIds, setDeletingIds] = useState<number[]>([]);

  const user = useAuthStore((s) => s.user);
  const behaviors = useComposer((s) => s.behaviors);
  const toggleBehavior = useComposer((s) => s.toggleBehavior);
  const setBehaviorReport = useComposer((s) => s.setBehaviorReport);
  const removeBehaviors = useComposer((s) => s.removeBehaviors);
  const behaviorReport = behaviors.find((b) => !b.icon)?.content ?? "";

  const itemForm = useForm<CreateBehaviorFormSchema>({
    resolver: zodResolver(createBehaviorFormSchema),
    defaultValues: {
      content: "",
      icon: "footprints",
      categoryName: defaultBehaviors[0]?.name ?? null,
    },
  });

  const categoryForm = useForm<CreateCategoryFormSchema>({
    resolver: zodResolver(createCategoryFormSchema),
    defaultValues: {
      name: "",
    },
  });

  const loadCustom = async () => {
    const [items, cats] = await Promise.all([
      getUserBehaviors(user?.id),
      getUserCategories("behavior", user?.id),
    ]);
    setCustomItems(items);
    setUserCategories(cats);
  };

  const handleOpen = async () => {
    setDeletingIds([]);
    setSearchQuery("");
    setActiveForm("none");
    itemForm.reset({
      content: "",
      icon: "footprints",
      categoryName: defaultBehaviors[0]?.name ?? null,
    });
    categoryForm.reset({ name: "" });
    setOpen(true);
    await loadCustom();
  };

  const toggleForm = (target: ActiveForm) => {
    setActiveForm((prev) => (prev === target ? "none" : target));
  };

  const onSubmitItem = async (data: CreateBehaviorFormSchema) => {
    const created = await createBehavior(
      data.content,
      data.icon ?? "footprints",
      data.categoryName ?? null,
      user?.id
    );
    setCustomItems((prev) => [...prev, created]);
    toggleBehavior({
      id: created.id,
      content: created.content,
      icon: created.icon,
    });
    itemForm.reset({
      content: "",
      icon: "footprints",
      categoryName: data.categoryName ?? defaultBehaviors[0]?.name ?? null,
    });
    setActiveForm("none");
  };

  const onSubmitCategory = async (data: CreateCategoryFormSchema) => {
    const createdCat = await createCategoryItem("behavior", data.name, user?.id);
    setUserCategories((prev) => [...prev, createdCat]);
    itemForm.setValue("categoryName", createdCat.name);
    categoryForm.reset({ name: "" });
    setActiveForm("none");
  };

  const handleInstantCreate = async (rawContent: string) => {
    const parsed = createBehaviorFormSchema.safeParse({
      content: rawContent,
      icon: "footprints",
      categoryName: null,
    });
    if (!parsed.success) return;
    const created = await createBehavior(
      parsed.data.content,
      parsed.data.icon ?? "footprints",
      null,
      user?.id
    );
    setCustomItems((prev) => [...prev, created]);
    toggleBehavior({
      id: created.id,
      content: created.content,
      icon: created.icon,
    });
    setSearchQuery("");
  };

  const handleDeleteCategory = async (categoryId: number) => {
    await deleteCategoryItem(categoryId);
    await loadCustom();
  };

  const toggleDeleteId = (id: number) => {
    setDeletingIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    if (deletingIds.length === 0) return;
    await deleteBehaviors(deletingIds);
    removeBehaviors(deletingIds);
    setDeletingIds([]);
    await loadCustom();
  };

  const allCategoryNames = [
    ...defaultBehaviors.map((c) => c.name),
    ...userCategories
      .map((c) => c.name)
      .filter(
        (name) =>
          !defaultBehaviors.some(
            (d) => d.name.toLowerCase() === name.toLowerCase()
          )
      ),
  ];

  const trimmedQuery = searchQuery.trim();
  const normalizedQuery = trimmedQuery.toLowerCase();

  const uncategorizedCustom = customItems
    .filter(
      (item) =>
        !item.categoryName ||
        !allCategoryNames.some(
          (catName) => catName.toLowerCase() === item.categoryName?.toLowerCase()
        )
    )
    .filter((item) =>
      !normalizedQuery
        ? true
        : item.content.toLowerCase().includes(normalizedQuery)
    );

  const combinedCategories = allCategoryNames
    .map((catName) => {
      const defaultCat = defaultBehaviors.find(
        (d) => d.name.toLowerCase() === catName.toLowerCase()
      );
      const userCat = userCategories.find(
        (u) => u.name.toLowerCase() === catName.toLowerCase()
      );

      const jsonItems = (defaultCat?.items ?? [])
        .filter((item) =>
          !normalizedQuery
            ? true
            : item.content.toLowerCase().includes(normalizedQuery)
        )
        .map((item) => ({
          id: undefined as number | undefined,
          content: item.content,
          icon: item.icon,
          isCustom: false,
        }));

      const catCustomItems = customItems
        .filter(
          (item) =>
            item.categoryName?.toLowerCase() === catName.toLowerCase()
        )
        .filter((item) =>
          !normalizedQuery
            ? true
            : item.content.toLowerCase().includes(normalizedQuery)
        )
        .map((item) => ({
          id: item.id,
          content: item.content,
          icon: item.icon,
          isCustom: true,
        }));

      return {
        name: catName,
        userCategoryId: defaultCat ? undefined : userCat?.id,
        isUserCreated: !defaultCat && Boolean(userCat),
        items: [...jsonItems, ...catCustomItems],
      };
    })
    .filter(
      (cat) =>
        cat.items.length > 0 || (!normalizedQuery && cat.isUserCreated)
    );

  const exactMatchExists =
    customItems.some((i) => i.content.toLowerCase() === normalizedQuery) ||
    defaultBehaviors.some((cat) =>
      cat.items.some((i) => i.content.toLowerCase() === normalizedQuery)
    );

  const hasAnyMatch =
    uncategorizedCustom.length > 0 ||
    combinedCategories.some((c) => c.items.length > 0);

  const isSelectionMode = deletingIds.length > 0;

  return (
    <>
      <NavButton Icon={Footprints} badge={behaviors.length} onPress={handleOpen}>
        Comportamento
      </NavButton>

      <Drawer
        isOpen={open}
        onClose={() => {
          setDeletingIds([]);
          setSearchQuery("");
          setActiveForm("none");
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
          <DrawerHeader className="pb-4 flex-row items-center gap-3">
            <DrawerCloseButton className="w-10 h-10 rounded-full bg-[#F2F3F5] items-center justify-center p-0 active:opacity-75">
              <X size={18} color="#16181D" />
            </DrawerCloseButton>
            <VStack space="xs" className="flex-1">
              <Text className="text-[18px] font-heading text-[#16181D]">
                O que você fez naquela hora?
              </Text>
              <Text className="text-xs font-subtitle text-[#5A606B]">
                Registre suas ações e comportamentos
              </Text>
            </VStack>
          </DrawerHeader>

          <Input className="h-11 rounded-xl bg-[#F2F3F5] border-transparent data-[focus=true]:bg-white data-[focus=true]:border-[#16181D] shadow-none px-3.5 mb-2.5">
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

          <HStack space="sm" className="mb-2">
            <Pressable
              onPress={() => toggleForm("item")}
              className={`flex-1 h-10 rounded-xl flex-row items-center justify-center gap-1.5 border ${
                activeForm === "item"
                  ? "bg-[#16181D] border-[#16181D]"
                  : "bg-white border-[#E6E8EC]"
              }`}
            >
              <Plus
                size={15}
                color={activeForm === "item" ? "#FFFFFF" : "#16181D"}
              />
              <Text
                className={`text-xs font-semibold ${
                  activeForm === "item" ? "text-white" : "text-[#16181D]"
                }`}
              >
                Novo comportamento
              </Text>
            </Pressable>

            <Pressable
              onPress={() => toggleForm("category")}
              className={`flex-1 h-10 rounded-xl flex-row items-center justify-center gap-1.5 border ${
                activeForm === "category"
                  ? "bg-[#16181D] border-[#16181D]"
                  : "bg-white border-[#E6E8EC]"
              }`}
            >
              <FolderPlus
                size={15}
                color={activeForm === "category" ? "#FFFFFF" : "#16181D"}
              />
              <Text
                className={`text-xs font-semibold ${
                  activeForm === "category" ? "text-white" : "text-[#16181D]"
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
                name="content"
                render={({ field, fieldState }) => (
                  <FormControl isInvalid={Boolean(fieldState.error)}>
                    <HStack space="sm" className="items-center">
                      <Input className="flex-1 h-10 rounded-lg bg-white border-[#E6E8EC] shadow-none px-3">
                        <InputField
                          value={field.value}
                          onChangeText={field.onChange}
                          onBlur={field.onBlur}
                          placeholder="Ex: Liguei para um amigo, fui caminhar..."
                          maxLength={60}
                          autoFocus
                          returnKeyType="done"
                          onSubmitEditing={itemForm.handleSubmit(onSubmitItem)}
                        />
                      </Input>
                      <Button
                        size="sm"
                        rounding="lg"
                        className="h-10 px-4 bg-[#16181D]"
                        disabled={itemForm.formState.isSubmitting}
                        onPress={itemForm.handleSubmit(onSubmitItem)}
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
                name="icon"
                render={({ field }) => (
                  <VStack space="xs">
                    <Text className="text-xs font-subtitle-medium text-[#5A606B]">
                      Ícone:
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 6 }}
                    >
                      {AVAILABLE_BEHAVIOR_ICONS.map((ic) => {
                        const isSelected = field.value === ic.id;
                        const IconComponent = ic.Icon;
                        return (
                          <Pressable
                            key={ic.id}
                            onPress={() => field.onChange(ic.id)}
                            className={`w-8 h-8 rounded-lg items-center justify-center border ${
                              isSelected
                                ? "bg-[#E8F1FB] border-[#1E4E8C]"
                                : "bg-white border-[#E6E8EC]"
                            }`}
                          >
                            <IconComponent
                              size={15}
                              color={isSelected ? "#1E4E8C" : "#5A606B"}
                            />
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </VStack>
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
                      {allCategoryNames.map((catName) => {
                        const isSelected = field.value === catName;
                        return (
                          <Pressable
                            key={catName}
                            onPress={() =>
                              field.onChange(isSelected ? null : catName)
                            }
                            className={`flex-row items-center h-7 rounded-lg px-2.5 gap-1 border ${
                              isSelected
                                ? "bg-[#E8F1FB] border-[#1E4E8C]"
                                : "bg-white border-[#E6E8EC]"
                            }`}
                          >
                            {isSelected && <Check size={12} color="#1E4E8C" />}
                            <Text
                              className={`text-xs ${
                                isSelected
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
                          onSubmitEditing={categoryForm.handleSubmit(
                            onSubmitCategory
                          )}
                        />
                      </Input>
                      <Button
                        size="sm"
                        rounding="lg"
                        className="h-10 px-4 bg-[#16181D]"
                        disabled={categoryForm.formState.isSubmitting}
                        onPress={categoryForm.handleSubmit(onSubmitCategory)}
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
            <VStack
              space="xs"
              className="mb-5 p-3.5 rounded-2xl bg-[#F4FAF6] border border-[#CBEAD9]"
            >
              <HStack className="justify-between items-center">
                <HStack className="items-center gap-1.5">
                  <Footprints size={13} color="#166534" />
                  <Text className="text-xs font-subtitle-semibold text-[#166534]">
                    Relate com suas palavras (opcional)
                  </Text>
                </HStack>
                {behaviorReport.length > 0 && (
                  <Pressable
                    onPress={() => setBehaviorReport("")}
                    hitSlop={8}
                    className="px-1.5 py-0.5 rounded-md active:opacity-70"
                  >
                    <Text className="text-[11px] font-subtitle-medium text-[#166534]">
                      Limpar
                    </Text>
                  </Pressable>
                )}
              </HStack>
              <View className="rounded-xl bg-white border border-[#CBEAD9] px-3 py-2 max-h-28">
                <EntryTextInput
                  value={behaviorReport}
                  onChangeText={setBehaviorReport}
                  placeholder="Descreva o que você fez naquela hora (ex: saí para tomar ar, liguei para um amigo...)"
                  minHeight={56}
                  scrollEnabled
                  style={{ maxHeight: 96, paddingTop: 2, fontSize: 14, lineHeight: 20 }}
                  className="text-sm text-[#16181D]"
                />
              </View>
            </VStack>

            {trimmedQuery.length > 0 && !exactMatchExists && (
              <VStack space="sm" className="mb-5">
                {!hasAnyMatch && (
                  <Text className="text-sm font-subtitle text-[#5A606B]">
                    Nenhum comportamento com esse nome ainda.
                  </Text>
                )}
                <Pressable
                  onPress={() => handleInstantCreate(trimmedQuery)}
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
                      Adicionar aos seus comportamentos
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
                    className={`text-xs font-subtitle ${
                      isSelectionMode
                        ? "text-destructive font-subtitle-medium"
                        : "text-[#9AA0AA]"
                    }`}
                  >
                    {isSelectionMode
                      ? `${deletingIds.length} selecionado(s)`
                      : "Segure para excluir"}
                  </Text>
                </HStack>
                <HStack className="flex-wrap gap-2">
                  {uncategorizedCustom.map((item) => {
                    const isSelected = behaviors.some(
                      (b) =>
                        b.id === item.id ||
                        b.content.toLowerCase() === item.content.toLowerCase()
                    );
                    const isMarkedForDelete = deletingIds.includes(item.id);
                    const iconElement = React.createElement(
                      getBehaviorIcon(item.icon),
                      {
                        size: 14,
                        color: isMarkedForDelete
                          ? "#ef4444"
                          : isSelected
                            ? "#1E4E8C"
                            : "#5A606B",
                      }
                    );

                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => {
                          if (isSelectionMode) {
                            toggleDeleteId(item.id);
                          } else {
                            toggleBehavior({
                              id: item.id,
                              content: item.content,
                              icon: item.icon,
                            });
                          }
                        }}
                        onLongPress={() => toggleDeleteId(item.id)}
                        className={`flex-row items-center h-[34px] rounded-[10px] px-3 gap-1.5 border ${
                          isMarkedForDelete
                            ? "bg-destructive/10 border-destructive"
                            : isSelected
                              ? "bg-[#E8F1FB] border-[#E8F1FB]"
                              : "bg-white border-[#E6E8EC]"
                        }`}
                      >
                        {isSelected && !isMarkedForDelete ? (
                          <Check size={14} color="#1E4E8C" />
                        ) : (
                          iconElement
                        )}
                        <Text
                          className={`text-[14px] ${
                            isMarkedForDelete
                              ? "text-destructive font-semibold"
                              : isSelected
                                ? "text-[#1E4E8C] font-semibold"
                                : "text-[#16181D] font-normal"
                          }`}
                        >
                          {item.content}
                        </Text>
                      </Pressable>
                    );
                  })}
                </HStack>
              </VStack>
            )}

            <VStack space="lg" className="pb-4">
              {combinedCategories.map((cat) => (
                <VStack key={cat.name} space="sm">
                  <HStack className="justify-between items-center">
                    <Text className="text-[13px] font-subtitle-medium text-[#5A606B]">
                      {cat.name}
                    </Text>
                    {cat.isUserCreated && (
                      <HStack space="sm" className="items-center">
                        <Text className="text-xs font-subtitle text-[#9AA0AA]">
                          Criada por você
                        </Text>
                        {cat.userCategoryId !== undefined && (
                          <Pressable
                            onPress={() =>
                              handleDeleteCategory(cat.userCategoryId!)
                            }
                            hitSlop={8}
                          >
                            <Trash2 size={14} color="#ef4444" />
                          </Pressable>
                        )}
                      </HStack>
                    )}
                  </HStack>
                  <HStack className="flex-wrap gap-2">
                    {cat.items.map((item) => {
                      const isSelected = behaviors.some(
                        (b) =>
                          (item.id !== undefined && b.id === item.id) ||
                          b.content.toLowerCase() === item.content.toLowerCase()
                      );
                      const isMarkedForDelete =
                        item.id !== undefined && deletingIds.includes(item.id);
                      const iconElement = React.createElement(
                        getBehaviorIcon(item.icon),
                        {
                          size: 14,
                          color: isMarkedForDelete
                            ? "#ef4444"
                            : isSelected
                              ? "#1E4E8C"
                              : "#5A606B",
                        }
                      );

                      return (
                        <Pressable
                          key={item.id ? `c-${item.id}` : `d-${item.content}`}
                          onPress={() => {
                            if (isSelectionMode && item.id !== undefined) {
                              toggleDeleteId(item.id);
                            } else if (!isSelectionMode) {
                              toggleBehavior(
                                item.id !== undefined
                                  ? {
                                      id: item.id,
                                      content: item.content,
                                      icon: item.icon,
                                    }
                                  : {
                                      content: item.content,
                                      icon: item.icon,
                                    }
                              );
                            }
                          }}
                          onLongPress={
                            item.isCustom && item.id !== undefined
                              ? () => toggleDeleteId(item.id!)
                              : undefined
                          }
                          className={`flex-row items-center h-[34px] rounded-[10px] px-3 gap-1.5 border ${
                            isMarkedForDelete
                              ? "bg-destructive/10 border-destructive"
                              : isSelected
                                ? "bg-[#E8F1FB] border-[#E8F1FB]"
                                : "bg-white border-[#E6E8EC]"
                          }`}
                        >
                          {isSelected && !isMarkedForDelete ? (
                            <Check size={14} color="#1E4E8C" />
                          ) : (
                            iconElement
                          )}
                          <Text
                            className={`text-[14px] ${
                              isMarkedForDelete
                                ? "text-destructive font-semibold"
                                : isSelected
                                  ? "text-[#1E4E8C] font-semibold"
                                  : "text-[#16181D] font-normal"
                            }`}
                          >
                            {item.content}
                          </Text>
                        </Pressable>
                      );
                    })}
                    {cat.items.length === 0 && (
                      <Text className="text-xs text-[#9AA0AA] italic">
                        Nenhum comportamento nesta categoria ainda.
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
                  onPress={() => setDeletingIds([])}
                >
                  <ButtonText>Cancelar</ButtonText>
                </Button>
                <Button
                  variant="destructive"
                  rounding="2xl"
                  className="flex-1 h-[52px]"
                  onPress={handleDeleteSelected}
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
                  {behaviors.length === 0
                    ? "Concluir"
                    : behaviors.length === 1
                      ? "Adicionar 1 comportamento"
                      : `Adicionar ${behaviors.length} comportamentos`}
                </ButtonText>
              </Button>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
