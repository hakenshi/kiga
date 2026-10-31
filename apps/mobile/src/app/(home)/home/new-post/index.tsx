import { Avatar, AvatarFallbackText, AvatarImage } from "@/components/ui/avatar";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "expo-router";
import {
  Activity,
  Angry,
  Brain,
  Drama,
  Footprints,
  Frown,
  Image as ImageIcon,
  Laugh,
  Meh,
  Smile,
  X,
} from "lucide-react-native";
import { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import NavButton from "../../_components/nav-button";
import { ResourceDrawer } from "@/components/resource-drawer";
import { BehaviorDrawer, getBehaviorIcon } from "@/components/behavior-drawer";
import { EntryTextInput } from "@/components/entry-text-input";
import { createJournalEntry } from "@/lib/db/entries";
import { newEntrySchema } from "@/lib/db/zod/zod-schemas";
import type { NewEntryInput, NewEntrySchema } from "@/lib/db/zod/zod-types";
import { countWords } from "@/lib/utils";

const MOOD_OPTIONS = [
  { value: 1, label: "Muito Mal", Icon: Angry },
  { value: 2, label: "Mal", Icon: Frown },
  { value: 3, label: "Neutro", Icon: Meh },
  { value: 4, label: "Bem", Icon: Smile },
  { value: 5, label: "Muito Bem", Icon: Laugh },
] as const;

export default function NewPostPage() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const { user } = useAuthStore();

  // Data/hora capturada no momento da montagem (sem re-renders e sem setInterval)
  const entryDate = useMemo(() => new Date(), []);

  const weekday = entryDate
    .toLocaleDateString("pt-BR", { weekday: "long" })
    .replace("-feira", "");
  const dayAndMonth = entryDate.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
  });
  const formattedDate = `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${dayAndMonth}`;
  const formattedTime = entryDate.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Formulário padronizado com React Hook Form + Zod
  const {
    control,
    handleSubmit,
    watch,
    getValues,
    setValue,
    formState: { isSubmitting },
  } = useForm<NewEntryInput, any, NewEntrySchema>({
    resolver: zodResolver(newEntrySchema),
    defaultValues: {
      content: "",
      moodId: null,
      emotions: [],
      thoughts: [],
      reactions: [],
      behaviors: [],
    },
  });

  // oxlint-disable-next-line react/incompatible-library
  const selectedMood = watch("moodId");
  const content = watch("content") ?? "";
  const selectedEmotions = watch("emotions") ?? [];
  const selectedThoughts = watch("thoughts") ?? [];
  const selectedReactions = watch("reactions") ?? [];
  const selectedBehaviors = watch("behaviors") ?? [];

  const wordCount = useMemo(() => countWords(content), [content]);

  // Toggle selection handlers integrados ao react-hook-form
  const toggleEmotion = (id: number, name: string) => {
    const current = getValues("emotions") ?? [];
    const next = current.some((item) => item.id === id)
      ? current.filter((item) => item.id !== id)
      : [...current, { id, name }];
    setValue("emotions", next, { shouldValidate: true });
  };

  const toggleThought = (id: number, name: string) => {
    const current = getValues("thoughts") ?? [];
    const next = current.some((item) => item.id === id)
      ? current.filter((item) => item.id !== id)
      : [...current, { id, name }];
    setValue("thoughts", next, { shouldValidate: true });
  };

  const toggleReaction = (id: number, name: string) => {
    const current = getValues("reactions") ?? [];
    const next = current.some((item) => item.id === id)
      ? current.filter((item) => item.id !== id)
      : [...current, { id, name }];
    setValue("reactions", next, { shouldValidate: true });
  };

  const toggleBehavior = (item: {
    id?: number;
    content: string;
    icon?: string | null;
  }) => {
    const current = getValues("behaviors") ?? [];
    const exists = current.some(
      (b) =>
        (item.id !== undefined && b.id === item.id) ||
        b.content.toLowerCase() === item.content.toLowerCase()
    );
    const next = exists
      ? current.filter(
          (b) =>
            !(
              (item.id !== undefined && b.id === item.id) ||
              b.content.toLowerCase() === item.content.toLowerCase()
            )
        )
      : [...current, item];
    setValue("behaviors", next, { shouldValidate: true });
  };

  // Salvar Entry via Service
  const onSave = async (formData: NewEntrySchema) => {
    try {
      await createJournalEntry({
        userId: user?.id ?? 1,
        content: formData.content,
        moodId: formData.moodId,
        emotions: formData.emotions,
        thoughts: formData.thoughts,
        reactions: formData.reactions,
        behaviors: formData.behaviors,
        date: entryDate,
      });

      router.push("/(home)/home");
    } catch (err) {
      console.error("Error saving journal entry:", err);
    }
  };

  const hasSelectedChips =
    selectedEmotions.length > 0 ||
    selectedThoughts.length > 0 ||
    selectedReactions.length > 0 ||
    selectedBehaviors.length > 0;

  return (
    <VStack className="flex-1 bg-white" style={{ paddingBottom: bottom }}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ paddingTop: top }} className="bg-white border-b border-gray-100">
          <HStack className="px-4 h-14 justify-between items-center">
            {/* Left Slot: 96px */}
            <HStack className="w-24 items-center justify-start">
              <Pressable
                onPress={() => router.push("/(home)/home")}
                className="w-10 h-10 rounded-full items-center justify-center active:bg-gray-100"
                hitSlop={8}
              >
                <X size={22} color="#16181D" />
              </Pressable>
            </HStack>

            {/* Center Date & Time: fixo e estático por montagem */}
            <VStack className="items-center justify-center flex-1">
              <Text className="font-semibold text-sm text-foreground">
                {formattedDate}
              </Text>
              <Text className="text-xs text-muted-foreground">{formattedTime}</Text>
            </VStack>

            {/* Right Slot: 96px */}
            <HStack className="w-24 items-center justify-end">
              <Pressable
                onPress={handleSubmit(onSave)}
                disabled={isSubmitting || !content.trim()}
                className={`h-10 px-5 rounded-full items-center justify-center ${isSubmitting || !content.trim()
                    ? "bg-muted"
                    : "bg-primary active:opacity-85"
                  }`}
              >
                <Text className="text-primary-foreground font-semibold text-sm">
                  {isSubmitting ? "Salvando..." : "Salvar"}
                </Text>
              </Pressable>
            </HStack>
          </HStack>
        </View>

        {/* Conteúdo Principal */}
        <VStack className="flex-1">
          {/* Mood Selector Row */}
          <HStack className="justify-between px-4 py-3 items-center border-b border-border">
            <Text className="text-[13px] text-muted-foreground font-normal">
              Como você está?
            </Text>
            <HStack className="items-center" space="xs">
              {MOOD_OPTIONS.map(({ value, Icon }) => {
                const isSelected = selectedMood === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() =>
                      setValue("moodId", isSelected ? null : value, {
                        shouldValidate: true,
                      })
                    }
                    className={`w-[30px] h-[30px] rounded-full items-center justify-center active:opacity-70 ${isSelected
                        ? "bg-background border-[1.5px] border-foreground"
                        : "bg-secondary"
                      }`}
                  >
                    <Icon
                      size={18}
                      color={isSelected ? "#18181b" : "#9AA0AA"}
                    />
                  </Pressable>
                );
              })}
            </HStack>
          </HStack>

          {/* Text Editor Area com componente reutilizável EntryTextInput */}
          <View className="flex-1 overflow-hidden">
            <Controller
              name="content"
              control={control}
              render={({ field: { onChange, value } }) => (
                <EntryTextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="O que está acontecendo agora?"
                  avatar={
                    <Avatar>
                      <AvatarImage />
                      <AvatarFallbackText>{user?.firstName}</AvatarFallbackText>
                    </Avatar>
                  }
                />
              )}
            />
          </View>

          {/* Selected Chips Strip */}
          {hasSelectedChips && (
            <View className="px-4 pb-2">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 6, alignItems: "center" }}
              >
                {selectedEmotions.map((e) => (
                  <Pressable
                    key={`em-${e.id}`}
                    onPress={() => toggleEmotion(e.id, e.name)}
                    className="flex-row items-center bg-secondary border border-border rounded-full px-3 py-1.5 gap-1.5"
                  >
                    <Text className="text-xs font-medium text-foreground">
                      {e.name}
                    </Text>
                    <X size={12} color="#9CA3AF" />
                  </Pressable>
                ))}
                {selectedThoughts.map((t) => (
                  <Pressable
                    key={`th-${t.id}`}
                    onPress={() => toggleThought(t.id, t.name)}
                    className="flex-row items-center bg-secondary border border-border rounded-full px-3 py-1.5 gap-1.5"
                  >
                    <Text className="text-xs font-medium text-foreground">
                      “{t.name}”
                    </Text>
                    <X size={12} color="#9CA3AF" />
                  </Pressable>
                ))}
                {selectedReactions.map((r) => (
                  <Pressable
                    key={`re-${r.id}`}
                    onPress={() => toggleReaction(r.id, r.name)}
                    className="flex-row items-center bg-secondary border border-border rounded-full px-3 py-1.5 gap-1.5"
                  >
                    <Text className="text-xs font-medium text-foreground">
                      {r.name}
                    </Text>
                    <X size={12} color="#9CA3AF" />
                  </Pressable>
                ))}
                {selectedBehaviors.map((b, idx) => {
                  const IconComp = getBehaviorIcon(b.icon);
                  return (
                    <Pressable
                      key={`beh-${b.id ?? idx}`}
                      onPress={() => toggleBehavior(b)}
                      className="flex-row items-center bg-secondary border border-border rounded-full px-3 py-1.5 gap-1.5"
                    >
                      <IconComp size={12} color="#18181b" />
                      <Text className="text-xs font-medium text-foreground">
                        {b.content}
                      </Text>
                      <X size={12} color="#9CA3AF" />
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Metadata bar: Word Count & Status */}
          <HStack className="justify-between px-5 py-2 border-t border-gray-50 items-center">
            <Text className="text-xs text-[#9AA0AA]">{wordCount} palavras</Text>
            <Text className="text-xs text-[#9AA0AA]">
              Salvo no banco de dados local
            </Text>
          </HStack>
        </VStack>

        {/* Bottom Toolbar */}
        <VStack>
          <HStack className="bg-white px-3 py-1 items-center justify-around w-full border-t border-gray-100">
            <ResourceDrawer
              type="emotion"
              selectedIds={selectedEmotions.map((e) => e.id)}
              onToggleSelect={toggleEmotion}
              userId={user?.id}
            >
              <ResourceDrawer.Trigger>
                <NavButton Icon={Drama} badge={selectedEmotions.length}>
                  Emoções
                </NavButton>
              </ResourceDrawer.Trigger>
            </ResourceDrawer>

            <ResourceDrawer
              type="thought"
              selectedIds={selectedThoughts.map((t) => t.id)}
              onToggleSelect={toggleThought}
              userId={user?.id}
            >
              <ResourceDrawer.Trigger>
                <NavButton Icon={Brain} badge={selectedThoughts.length}>
                  Pensamentos
                </NavButton>
              </ResourceDrawer.Trigger>
            </ResourceDrawer>

            <ResourceDrawer
              type="reaction"
              selectedIds={selectedReactions.map((r) => r.id)}
              onToggleSelect={toggleReaction}
              userId={user?.id}
            >
              <ResourceDrawer.Trigger>
                <NavButton Icon={Activity} badge={selectedReactions.length}>
                  Reações
                </NavButton>
              </ResourceDrawer.Trigger>
            </ResourceDrawer>

            <BehaviorDrawer
              selectedBehaviors={selectedBehaviors}
              onToggleSelect={toggleBehavior}
              userId={user?.id}
            >
              <BehaviorDrawer.Trigger>
                <NavButton Icon={Footprints} badge={selectedBehaviors.length}>
                  Comportamento
                </NavButton>
              </BehaviorDrawer.Trigger>
            </BehaviorDrawer>

            <NavButton Icon={ImageIcon} onPress={() => {}}>
              Foto
            </NavButton>
          </HStack>
        </VStack>
      </KeyboardAvoidingView>
    </VStack>
  );
}
