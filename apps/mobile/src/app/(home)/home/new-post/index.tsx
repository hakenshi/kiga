import { Avatar, AvatarFallbackText, AvatarImage } from "@/components/ui/avatar";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "expo-router";
import {
  Activity,
  Angry,
  Brain,
  Drama,
  Frown,
  Image as ImageIcon,
  Laugh,
  Meh,
  Smile,
  X,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import NavButton from "../../_components/nav-button";
import { ResourcePicker } from "@/components/resource-drawer";
import { createJournalEntry } from "@/lib/db/entries";
import {
  newPostSchema,
  type NewPostInput,
  type NewPostSchema,
} from "@/lib/db/zod/zod-schemas";
import { countWords } from "@/lib/utils";

const MOOD_OPTIONS = [
  { value: 1, label: "Muito Mal", Icon: Angry },
  { value: 2, label: "Mal", Icon: Frown },
  { value: 3, label: "Neutro", Icon: Meh },
  { value: 4, label: "Bem", Icon: Smile },
  { value: 5, label: "Muito Bem", Icon: Laugh },
] as const;

const DRAWER_CONFIGS = {
  emotion: {
    title: "O que você está sentindo?",
    searchPlaceholder: "Buscar ou criar emoção",
    addLabel: "Nova emoção",
    singularLabel: "emoção",
    pluralLabel: "emoções",
  },
  thought: {
    title: "Pensamentos automáticos",
    searchPlaceholder: "Buscar ou criar pensamento",
    addLabel: "Novo pensamento",
    singularLabel: "pensamento",
    pluralLabel: "pensamentos",
  },
  reaction: {
    title: "Reações e sensações",
    searchPlaceholder: "Buscar ou criar reação corporal",
    addLabel: "Nova reação",
    singularLabel: "reação",
    pluralLabel: "reações",
  },
} as const;

export default function NewPostPage() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const { user } = useAuthStore();

  // Active Bottom Sheet Drawer: "emotion" | "thought" | "reaction" | null
  const [activeDrawer, setActiveDrawer] = useState<
    "emotion" | "thought" | "reaction" | null
  >(null);

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
    setValue,
    formState: { isSubmitting },
  } = useForm<NewPostInput, any, NewPostSchema>({
    resolver: zodResolver(newPostSchema),
    defaultValues: {
      content: "",
      moodId: null,
      emotions: [],
      thoughts: [],
      reactions: [],
    },
  });

  const selectedMood = watch("moodId");
  const content = watch("content") ?? "";
  const selectedEmotions = watch("emotions") ?? [];
  const selectedThoughts = watch("thoughts") ?? [];
  const selectedReactions = watch("reactions") ?? [];

  const wordCount = useMemo(() => countWords(content), [content]);

  // Toggle selection handlers integrados ao react-hook-form
  const toggleEmotion = (id: number, name: string) => {
    const current = watch("emotions") ?? [];
    const next = current.some((item) => item.id === id)
      ? current.filter((item) => item.id !== id)
      : [...current, { id, name }];
    setValue("emotions", next, { shouldValidate: true });
  };

  const toggleThought = (id: number, name: string) => {
    const current = watch("thoughts") ?? [];
    const next = current.some((item) => item.id === id)
      ? current.filter((item) => item.id !== id)
      : [...current, { id, name }];
    setValue("thoughts", next, { shouldValidate: true });
  };

  const toggleReaction = (id: number, name: string) => {
    const current = watch("reactions") ?? [];
    const next = current.some((item) => item.id === id)
      ? current.filter((item) => item.id !== id)
      : [...current, { id, name }];
    setValue("reactions", next, { shouldValidate: true });
  };

  // Salvar Post via Service
  const onSave = async (formData: NewPostSchema) => {
    try {
      await createJournalEntry({
        userId: user?.id ?? 1,
        content: formData.content,
        moodId: formData.moodId,
        emotions: formData.emotions,
        thoughts: formData.thoughts,
        reactions: formData.reactions,
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
    selectedReactions.length > 0;

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
              <Text className="font-semibold text-sm text-[#16181D]">
                {formattedDate}
              </Text>
              <Text className="text-xs text-[#5A606B]">{formattedTime}</Text>
            </VStack>

            {/* Right Slot: 96px */}
            <HStack className="w-24 items-center justify-end">
              <Pressable
                onPress={handleSubmit(onSave)}
                disabled={isSubmitting || !content.trim()}
                className={`h-10 px-5 rounded-full items-center justify-center ${
                  isSubmitting || !content.trim()
                    ? "bg-gray-300"
                    : "bg-[#16181D] active:opacity-85"
                }`}
              >
                <Text className="text-white font-semibold text-sm">
                  {isSubmitting ? "Salvando..." : "Salvar"}
                </Text>
              </Pressable>
            </HStack>
          </HStack>
        </View>

        {/* Conteúdo Principal */}
        <VStack className="flex-1">
          {/* Mood Selector Row */}
          <HStack className="justify-between px-4 py-3 items-center border-b border-gray-100">
            <Text className="text-[13px] text-[#5A606B] font-normal">
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
                    className={`w-[30px] h-[30px] rounded-full items-center justify-center active:opacity-70 ${
                      isSelected
                        ? "bg-white border-[1.5px] border-[#16181D]"
                        : "bg-[#F2F3F5]"
                    }`}
                  >
                    <Icon
                      size={18}
                      color={isSelected ? "#16181D" : "#9AA0AA"}
                    />
                  </Pressable>
                );
              })}
            </HStack>
          </HStack>

          {/* Text Editor Area controlado */}
          <HStack className="flex-1 p-5 items-start overflow-hidden" space="md">
            <Avatar>
              <AvatarImage />
              <AvatarFallbackText>{user?.firstName}</AvatarFallbackText>
            </Avatar>
            <VStack className="flex-1 h-full">
              <Controller
                name="content"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    placeholder="O que está acontecendo agora?"
                    placeholderTextColor="#9AA0AA"
                    className="flex-1 p-0 text-base"
                    style={{
                      flex: 1,
                      textAlignVertical: "top",
                      color: "#16181D",
                    }}
                    multiline
                    scrollEnabled
                  />
                )}
              />
            </VStack>
          </HStack>

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
                    className="flex-row items-center bg-[#F3F4F6] border border-gray-200 rounded-full px-3 py-1.5 gap-1.5"
                  >
                    <Text className="text-xs font-medium text-[#16181D]">
                      {e.name}
                    </Text>
                    <X size={12} color="#9CA3AF" />
                  </Pressable>
                ))}
                {selectedThoughts.map((t) => (
                  <Pressable
                    key={`th-${t.id}`}
                    onPress={() => toggleThought(t.id, t.name)}
                    className="flex-row items-center bg-[#F3F4F6] border border-gray-200 rounded-full px-3 py-1.5 gap-1.5"
                  >
                    <Text className="text-xs font-medium text-[#16181D]">
                      “{t.name}”
                    </Text>
                    <X size={12} color="#9CA3AF" />
                  </Pressable>
                ))}
                {selectedReactions.map((r) => (
                  <Pressable
                    key={`re-${r.id}`}
                    onPress={() => toggleReaction(r.id, r.name)}
                    className="flex-row items-center bg-[#F3F4F6] border border-gray-200 rounded-full px-3 py-1.5 gap-1.5"
                  >
                    <Text className="text-xs font-medium text-[#16181D]">
                      {r.name}
                    </Text>
                    <X size={12} color="#9CA3AF" />
                  </Pressable>
                ))}
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
            <NavButton
              Icon={Drama}
              badge={selectedEmotions.length}
              onPress={() => setActiveDrawer("emotion")}
            >
              Emoções
            </NavButton>

            <NavButton
              Icon={Brain}
              badge={selectedThoughts.length}
              onPress={() => setActiveDrawer("thought")}
            >
              Pensamentos
            </NavButton>

            <NavButton
              Icon={Activity}
              badge={selectedReactions.length}
              onPress={() => setActiveDrawer("reaction")}
            >
              Reações
            </NavButton>

            <NavButton Icon={ImageIcon} onPress={() => {}}>
              Foto
            </NavButton>
          </HStack>
        </VStack>
      </KeyboardAvoidingView>

      {/* Composable Resource Drawer */}
      {activeDrawer && (
        <ResourcePicker
          isOpen={true}
          onClose={() => setActiveDrawer(null)}
          type={activeDrawer}
          selectedIds={
            activeDrawer === "emotion"
              ? selectedEmotions.map((e) => e.id)
              : activeDrawer === "thought"
              ? selectedThoughts.map((t) => t.id)
              : selectedReactions.map((r) => r.id)
          }
          onToggleSelect={
            activeDrawer === "emotion"
              ? toggleEmotion
              : activeDrawer === "thought"
              ? toggleThought
              : toggleReaction
          }
          userId={user?.id}
        >
          <ResourcePicker.Header title={DRAWER_CONFIGS[activeDrawer].title} />
          <ResourcePicker.Search
            placeholder={DRAWER_CONFIGS[activeDrawer].searchPlaceholder}
          />
          <ResourcePicker.Content
            addLabel={DRAWER_CONFIGS[activeDrawer].addLabel}
          />
          <ResourcePicker.Footer>
            {(() => {
              const count =
                activeDrawer === "emotion"
                  ? selectedEmotions.length
                  : activeDrawer === "thought"
                  ? selectedThoughts.length
                  : selectedReactions.length;
              const config = DRAWER_CONFIGS[activeDrawer];
              const label = count === 1 ? config.singularLabel : config.pluralLabel;

              return (
                <Button
                  className="w-full rounded-2xl bg-[#16181D] py-3.5"
                  onPress={() => setActiveDrawer(null)}
                >
                  <ButtonText className="text-white font-semibold text-center text-base">
                    {count > 0 ? `Adicionar ${count} ${label}` : "Pronto"}
                  </ButtonText>
                </Button>
              );
            })()}
          </ResourcePicker.Footer>
        </ResourcePicker>
      )}
    </VStack>
  );
}
