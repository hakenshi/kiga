import { EntryTextInput } from "@/components/entry-text-input";
import { Avatar, AvatarFallbackText, AvatarImage } from "@/components/ui/avatar";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { getBehaviorIcon } from "@/lib/behavior-icons";
import { createJournalEntry } from "@/lib/db/entries";
import { newEntrySchema } from "@/lib/db/zod/zod-schemas";
import { countWords } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useEntryStore } from "@/stores/journal-store";
import { useNewPostStore } from "@/stores/new-post-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  Activity,
  Angry,
  Brain,
  Crop,
  Drama,
  Frown,
  Image as ImageIcon,
  Laugh,
  Lock,
  Meh,
  Smile,
  X,
} from "lucide-react-native";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, ScrollView, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NavButton from "../../_components/nav-button";
import EmotionsDrawer from "../new-post/_components/emotions-drawer";
import ThoughtsDrawer from "../new-post/_components/thoughts-drawer";
import ReactionsDrawer from "../new-post/_components/reactions-drawer";
import BehaviorsDrawer from "../new-post/_components/behaviors-drawer";
import ImageCropperModal from "../new-post/_components/image-cropper-modal";

const MOOD_OPTIONS = [
  { value: 1, label: "Muito Mal", Icon: Angry },
  { value: 2, label: "Mal", Icon: Frown },
  { value: 3, label: "Neutro", Icon: Meh },
  { value: 4, label: "Bem", Icon: Smile },
  { value: 5, label: "Muito Bem", Icon: Laugh },
] as const;

function MediaCell({
  uri,
  onRemove,
  onEdit,
}: {
  uri: string;
  onRemove: (uri: string) => void;
  onEdit: (uri: string) => void;
}) {
  const [aspectRatio, setAspectRatio] = useState(4 / 3);

  return (
    <Pressable
      onPress={() => onEdit(uri)}
      className="w-full rounded-2xl overflow-hidden border border-border relative bg-white"
      style={{ aspectRatio }}
    >
      <Image
        source={{ uri }}
        style={{ width: "100%", height: "100%" }}
        contentFit="contain"
        onLoad={(e) => {
          if (e.source.width && e.source.height) {
            setAspectRatio(e.source.width / e.source.height);
          }
        }}
      />
      <Pressable
        onPress={() => onRemove(uri)}
        hitSlop={6}
        style={{ backgroundColor: "rgba(22, 24, 29, 0.82)" }}
        className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full items-center justify-center active:opacity-80"
      >
        <X size={15} color="#FFFFFF" />
      </Pressable>
      <Pressable
        onPress={() => onEdit(uri)}
        hitSlop={6}
        style={{ backgroundColor: "rgba(22, 24, 29, 0.82)" }}
        className="absolute bottom-2.5 right-2.5 h-7 px-3 rounded-full flex-row items-center justify-center gap-1.5 active:opacity-80"
      >
        <Crop size={13} color="#FFFFFF" />
        <Text className="text-[11px] font-heading text-white">Recortar</Text>
      </Pressable>
    </Pressable>
  );
}

function ComposerMediaGrid({
  urls,
  onRemove,
  onEdit,
}: {
  urls: string[];
  onRemove: (uri: string) => void;
  onEdit: (uri: string) => void;
}) {
  if (urls.length === 0) return null;

  return (
    <VStack space="sm" className="w-full">
      {urls.map((uri) => (
        <MediaCell
          key={uri}
          uri={uri}
          onRemove={onRemove}
          onEdit={onEdit}
        />
      ))}
    </VStack>
  );
}

export default function EditEntryPage() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { addEntry } = useEntryStore();
  const [entryDate] = useState(() => new Date());
  const [editingImageUri, setEditingImageUri] = useState<string | null>(null);

  const content = useNewPostStore((s) => s.content);
  const selectedMood = useNewPostStore((s) => s.moodId);
  const selectedEmotions = useNewPostStore((s) => s.emotions);
  const selectedThoughts = useNewPostStore((s) => s.thoughts);
  const selectedReactions = useNewPostStore((s) => s.reactions);
  const selectedBehaviors = useNewPostStore((s) => s.behaviors);
  const selectedImages = useNewPostStore((s) => s.images);

  const setContent = useNewPostStore((s) => s.setContent);
  const setMoodId = useNewPostStore((s) => s.setMoodId);
  const toggleEmotion = useNewPostStore((s) => s.toggleEmotion);
  const toggleThought = useNewPostStore((s) => s.toggleThought);
  const toggleReaction = useNewPostStore((s) => s.toggleReaction);
  const toggleBehavior = useNewPostStore((s) => s.toggleBehavior);
  const addImages = useNewPostStore((s) => s.addImages);
  const removeImage = useNewPostStore((s) => s.removeImage);
  const replaceImage = useNewPostStore((s) => s.replaceImage);
  const resetStore = useNewPostStore((s) => s.reset);

  const {
    control,
    handleSubmit,
    reset: resetForm,
    formState: { isSubmitting },
  } = useForm<NewEntryInput, any, NewEntrySchema>({
    resolver: zodResolver(newEntrySchema),
    values: {
      content,
      moodId: selectedMood,
      emotions: selectedEmotions,
      thoughts: selectedThoughts,
      reactions: selectedReactions,
      behaviors: selectedBehaviors,
      images: selectedImages,
    },
  });

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

  const wordCount = countWords(content);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      addImages(result.assets.map((asset) => asset.uri));
    }
  };

  const onSave = async (parsed: NewEntrySchema) => {
    try {
      const newEntry = await createJournalEntry({
        userId: user?.id ?? 1,
        content: parsed.content,
        moodId: parsed.moodId,
        emotions: parsed.emotions,
        thoughts: parsed.thoughts,
        reactions: parsed.reactions,
        behaviors: parsed.behaviors,
        images: parsed.images,
        date: entryDate,
      });

      addEntry(newEntry);
      resetStore();
      resetForm();
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
        <View
          style={{ paddingTop: top }}
          className="bg-white border-b border-gray-100"
        >
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
              <Text className="font-heading text-sm text-foreground">
                {formattedDate}
              </Text>
              <Text className="font-subtitle text-xs text-muted-foreground">
                {formattedTime}
              </Text>
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
            <Text className="text-[13px] font-subtitle text-muted-foreground">
              Como você está?
            </Text>
            <HStack className="items-center" space="xs">
              {MOOD_OPTIONS.map(({ value, Icon }) => {
                const isSelected = selectedMood === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setMoodId(isSelected ? null : value)}
                    className="size-8 rounded-full items-center justify-center active:opacity-70"
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

          {/* Text Editor Area + Attached Media (Twitter-style) */}
          <ScrollView
            className="flex-1"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <HStack className="p-5 gap-3 items-start">
              <Avatar>
                <AvatarImage />
                <AvatarFallbackText>{user?.firstName}</AvatarFallbackText>
              </Avatar>
              <VStack className="flex-1" space="md">
                <Controller
                  control={control}
                  name="content"
                  render={({ field }) => (
                    <EntryTextInput
                      value={field.value}
                      onChangeText={(text) => {
                        field.onChange(text);
                        setContent(text);
                      }}
                      scrollEnabled={false}
                      minHeight={72}
                      placeholder="O que está acontecendo agora?"
                    />
                  )}
                />

                {selectedImages.length > 0 && (
                  <ComposerMediaGrid
                    urls={selectedImages}
                    onRemove={removeImage}
                    onEdit={(uri) => setEditingImageUri(uri)}
                  />
                )}
              </VStack>
            </HStack>
          </ScrollView>

          {/* Selected Chips Strip */}
          {hasSelectedChips && (
            <View className="py-2.5 border-t border-[#F2F3F5]">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 20,
                  gap: 8,
                  alignItems: "center",
                }}
              >
                {selectedEmotions.map((e) => (
                  <Pressable
                    key={`em-${e.id ?? e.name}`}
                    onPress={() => toggleEmotion(e)}
                    className="flex-row items-center bg-[#E8F1FB] border border-[#D0E3F7] rounded-[10px] px-3 py-1.5 gap-1.5 active:opacity-75"
                  >
                    <Drama size={13} color="#1E4E8C" />
                    <Text className="text-[13px] font-medium text-[#1E4E8C]">
                      {e.name}
                    </Text>
                    <X size={13} color="#1E4E8C" />
                  </Pressable>
                ))}
                {selectedThoughts.map((t) => (
                  <Pressable
                    key={`th-${t.id ?? t.name}`}
                    onPress={() => toggleThought(t)}
                    className="flex-row items-center bg-[#F0ECFA] border border-[#DFD6F5] rounded-[10px] px-3 py-1.5 gap-1.5 max-w-[220px] active:opacity-75"
                  >
                    <Brain size={13} color="#4B3B8F" />
                    <Text
                      numberOfLines={1}
                      className="text-[13px] font-medium text-[#4B3B8F] shrink"
                    >
                      “{t.name}”
                    </Text>
                    <X size={13} color="#4B3B8F" />
                  </Pressable>
                ))}
                {selectedReactions.map((r) => (
                  <Pressable
                    key={`re-${r.id ?? r.name}`}
                    onPress={() => toggleReaction(r)}
                    className="flex-row items-center bg-[#FDF3E2] border border-[#F7E3BE] rounded-[10px] px-3 py-1.5 gap-1.5 active:opacity-75"
                  >
                    <Activity size={13} color="#8A5A12" />
                    <Text className="text-[13px] font-medium text-[#8A5A12]">
                      {r.name}
                    </Text>
                    <X size={13} color="#8A5A12" />
                  </Pressable>
                ))}
                {selectedBehaviors.map((b, idx) => {
                  const iconElement = React.createElement(
                    getBehaviorIcon(b.icon),
                    {
                      size: 13,
                      color: "#166534",
                    }
                  );
                  return (
                    <Pressable
                      key={`beh-${b.id ?? idx}`}
                      onPress={() => toggleBehavior(b)}
                      className="flex-row items-center bg-[#EAF6F0] border border-[#CBEAD9] rounded-[10px] px-3 py-1.5 gap-1.5 max-w-[220px] active:opacity-75"
                    >
                      {iconElement}
                      <Text
                        numberOfLines={1}
                        className="text-[13px] font-medium text-[#166534] shrink"
                      >
                        {b.content}
                      </Text>
                      <X size={13} color="#166534" />
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </VStack>

        {/* Bottom Dock: Metadata + Toolbar */}
        <VStack className="bg-white border-t border-[#E6E8EC] pt-2 pb-1">
          <HStack className="justify-between px-5 pb-1.5 items-center">
            <Text className="text-xs font-subtitle text-[#9AA0AA]">
              {wordCount} {wordCount === 1 ? "palavra" : "palavras"}
            </Text>
            <HStack className="items-center gap-1">
              <Lock size={11} color="#9AA0AA" />
              <Text className="text-xs font-subtitle text-[#9AA0AA]">
                Salvo só neste aparelho
              </Text>
            </HStack>
          </HStack>

          <HStack className="px-2 items-center justify-around w-full">
            <EmotionsDrawer />
            <ThoughtsDrawer />
            <ReactionsDrawer />
            <BehaviorsDrawer />

            <NavButton
              Icon={ImageIcon}
              badge={selectedImages.length}
              onPress={handlePickImage}
            >
              Foto
            </NavButton>
          </HStack>
        </VStack>

        <ImageCropperModal
          visible={Boolean(editingImageUri)}
          uri={editingImageUri}
          onClose={() => setEditingImageUri(null)}
          onComplete={(newUri) => {
            if (editingImageUri) {
              replaceImage(editingImageUri, newUri);
            }
            setEditingImageUri(null);
          }}
        />
      </KeyboardAvoidingView>
    </VStack>
  );
}
