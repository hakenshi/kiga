import { EntryTextInput } from "@/components/entry-text-input";
import { ImageCarousel } from "@/components/image-carousel";
import { Avatar, AvatarFallbackText, AvatarImage } from "@/components/ui/avatar";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import NavButton from "@/app/(home)/_components/nav-button";
import { getBehaviorIcon } from "@/lib/behavior-icons";
import { countWords } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
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
  type LucideIcon,
} from "lucide-react-native";
import { createElement, useState, type PropsWithChildren, type ReactNode } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ComposerProvider, useComposer, useComposerActions } from "./composer-context";
import BehaviorsDrawer from "./drawers/behaviors-drawer";
import EmotionsDrawer from "./drawers/emotions-drawer";
import ImageCropperModal from "./drawers/image-cropper-modal";
import ReactionsDrawer from "./drawers/reactions-drawer";
import ThoughtsDrawer from "./drawers/thoughts-drawer";

const MOOD_OPTIONS = [
  { value: 1, label: "Muito Mal", Icon: Angry },
  { value: 2, label: "Mal", Icon: Frown },
  { value: 3, label: "Neutro", Icon: Meh },
  { value: 4, label: "Bem", Icon: Smile },
  { value: 5, label: "Muito Bem", Icon: Laugh },
] as const;

/* ------------------------------------------------------------------ Frame */

function Frame({ children }: PropsWithChildren) {
  const { bottom } = useSafeAreaInsets();
  return (
    <VStack className="flex-1 bg-white" style={{ paddingBottom: bottom }}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        {children}
      </KeyboardAvoidingView>
    </VStack>
  );
}

/* ----------------------------------------------------------------- Header */

interface HeaderProps {
  title: ReactNode;
  submit: ReactNode;
}

/** Topo com 3 slots fixos: fechar | título | ação. */
function Header({ title, submit }: HeaderProps) {
  const { top } = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: top }} className="bg-white border-b border-gray-100">
      <HStack className="px-4 h-14 justify-between items-center">
        <HStack className="w-24 items-center justify-start">
          <Close />
        </HStack>
        <VStack className="items-center justify-center flex-1">{title}</VStack>
        <HStack className="w-24 items-center justify-end">{submit}</HStack>
      </HStack>
    </View>
  );
}

function Close() {
  const { close } = useComposerActions();
  return (
    <Pressable
      onPress={close}
      className="w-10 h-10 rounded-full items-center justify-center active:bg-gray-100"
      hitSlop={8}
    >
      <X size={22} color="#16181D" />
    </Pressable>
  );
}

function formatEntryDate(date: Date) {
  const weekday = date.toLocaleDateString("pt-BR", { weekday: "long" }).replace("-feira", "");
  const dayAndMonth = date.toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
  return {
    day: `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${dayAndMonth}`,
    time: date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  };
}

/** Título padrão: data e hora do registro. */
function DateTitle() {
  const entryDate = useComposer((s) => s.entryDate);
  // Após reidratar do storage a data pode vir como string.
  const { day, time } = formatEntryDate(new Date(entryDate));
  return (
    <>
      <Text className="font-heading text-sm text-foreground">{day}</Text>
      <Text className="font-subtitle text-xs text-muted-foreground">{time}</Text>
    </>
  );
}

interface SubmitProps {
  children: string;
  pendingLabel?: string;
}

function Submit({ children, pendingLabel = "Salvando..." }: SubmitProps) {
  const { submit } = useComposerActions();
  const isSaving = useComposer((s) => s.isSaving);
  // Booleano derivado: não re-renderiza a cada letra digitada.
  const isEmpty = useComposer((s) => s.content.trim().length === 0);
  const disabled = isSaving || isEmpty;

  return (
    <Pressable
      onPress={submit}
      disabled={disabled}
      className={`h-10 px-5 rounded-full items-center justify-center ${
        disabled ? "bg-muted" : "bg-primary active:opacity-85"
      }`}
    >
      <Text className="text-primary-foreground font-semibold text-sm">
        {isSaving ? pendingLabel : children}
      </Text>
    </Pressable>
  );
}

/* ---------------------------------------------------------------- MoodRow */

function MoodRow() {
  const moodId = useComposer((s) => s.moodId);
  const setMoodId = useComposer((s) => s.setMoodId);

  return (
    <HStack className="justify-between px-4 py-3 items-center border-b border-border">
      <Text className="text-[13px] font-subtitle text-muted-foreground">Como você está?</Text>
      <HStack className="items-center" space="xs">
        {MOOD_OPTIONS.map(({ value, Icon }) => {
          const isSelected = moodId === value;
          return (
            <Pressable
              key={value}
              onPress={() => setMoodId(isSelected ? null : value)}
              className="size-8 rounded-full items-center justify-center active:opacity-70"
            >
              <Icon size={18} color={isSelected ? "#18181b" : "#9AA0AA"} />
            </Pressable>
          );
        })}
      </HStack>
    </HStack>
  );
}

/* ------------------------------------------------------------------- Body */

/** Área rolável. Os filhos definem o que aparece (contexto, editor, mídia...). */
function Body({ children }: PropsWithChildren) {
  return (
    <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
}

/** Linha do autor atual: avatar à esquerda, conteúdo à direita. */
function AuthorRow({ children }: PropsWithChildren) {
  const firstName = useAuthStore((s) => s.user?.firstName);
  return (
    <HStack className="p-5 gap-3 items-start">
      <Avatar>
        <AvatarImage />
        <AvatarFallbackText>{firstName}</AvatarFallbackText>
      </Avatar>
      <VStack className="flex-1" space="md">
        {children}
      </VStack>
    </HStack>
  );
}

interface EditorProps {
  placeholder: string;
}

function Editor({ placeholder }: EditorProps) {
  const content = useComposer((s) => s.content);
  const setContent = useComposer((s) => s.setContent);
  return (
    <EntryTextInput
      value={content}
      onChangeText={setContent}
      scrollEnabled={false}
      minHeight={72}
      placeholder={placeholder}
    />
  );
}

/* ------------------------------------------------------------------ Media */

/** Carrossel horizontal de imagens + recorte. */
function Media() {
  const images = useComposer((s) => s.images);
  const removeImage = useComposer((s) => s.removeImage);
  const replaceImage = useComposer((s) => s.replaceImage);
  const [editingUri, setEditingUri] = useState<string | null>(null);

  if (images.length === 0) return null;

  return (
    <>
      <ImageCarousel
        images={images}
        onRemove={(uri) => removeImage(uri)}
        onEdit={(uri) => setEditingUri(uri)}
      />
      <ImageCropperModal
        visible={editingUri !== null}
        uri={editingUri}
        onClose={() => setEditingUri(null)}
        onComplete={(newUri) => {
          if (editingUri) replaceImage(editingUri, newUri);
          setEditingUri(null);
        }}
      />
    </>
  );
}

/* -------------------------------------------------------------- ChipStrip */

interface RemovableChipProps {
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  bg: string;
  border: string;
  color: string;
  onPress: () => void;
  truncate?: boolean;
}

function RemovableChip({ Icon, label, bg, border, color, onPress, truncate }: RemovableChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center border rounded-[10px] px-3 py-1.5 gap-1.5 active:opacity-75 ${
        truncate ? "max-w-[220px]" : ""
      }`}
      style={{ backgroundColor: bg, borderColor: border }}
    >
      <Icon size={13} color={color} />
      <Text numberOfLines={1} className="text-[13px] font-medium shrink" style={{ color }}>
        {label}
      </Text>
      <X size={13} color={color} />
    </Pressable>
  );
}

function ChipStrip() {
  const emotions = useComposer((s) => s.emotions);
  const thoughts = useComposer((s) => s.thoughts);
  const reactions = useComposer((s) => s.reactions);
  const behaviors = useComposer((s) => s.behaviors);
  const toggleEmotion = useComposer((s) => s.toggleEmotion);
  const toggleThought = useComposer((s) => s.toggleThought);
  const toggleReaction = useComposer((s) => s.toggleReaction);
  const toggleBehavior = useComposer((s) => s.toggleBehavior);

  const isEmpty = emotions.length + thoughts.length + reactions.length + behaviors.length === 0;
  if (isEmpty) return null;

  return (
    <View className="py-2.5 border-t border-[#F2F3F5]">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, alignItems: "center" }}
      >
        {emotions.map((e) => (
          <RemovableChip
            key={`em-${e.id ?? e.name}`}
            Icon={Drama}
            label={e.name}
            bg="#E8F1FB"
            border="#D0E3F7"
            color="#1E4E8C"
            onPress={() => toggleEmotion(e)}
          />
        ))}
        {thoughts.map((t) => (
          <RemovableChip
            key={`th-${t.id ?? t.name}`}
            Icon={Brain}
            label={`“${t.name}”`}
            bg="#F0ECFA"
            border="#DFD6F5"
            color="#4B3B8F"
            onPress={() => toggleThought(t)}
            truncate
          />
        ))}
        {reactions.map((r) => (
          <RemovableChip
            key={`re-${r.id ?? r.name}`}
            Icon={Activity}
            label={r.name}
            bg="#FDF3E2"
            border="#F7E3BE"
            color="#8A5A12"
            onPress={() => toggleReaction(r)}
          />
        ))}
        {behaviors.map((b, idx) => (
          <RemovableChip
            key={`beh-${b.id ?? idx}`}
            Icon={getBehaviorIcon(b.icon)}
            label={b.content}
            bg="#EAF6F0"
            border="#CBEAD9"
            color="#166534"
            onPress={() => toggleBehavior(b)}
            truncate
          />
        ))}
      </ScrollView>
    </View>
  );
}

/* ------------------------------------------------------------------- Dock */

function WordCount() {
  // Assina só o número, não o texto inteiro.
  const wordCount = useComposer((s) => countWords(s.content));
  return (
    <Text className="text-xs font-subtitle text-[#9AA0AA]">
      {wordCount} {wordCount === 1 ? "palavra" : "palavras"}
    </Text>
  );
}

function PhotoButton() {
  const imageCount = useComposer((s) => s.images.length);
  const addImages = useComposer((s) => s.addImages);

  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      addImages(result.assets.map((asset) => asset.uri));
    }
  };

  return (
    <NavButton Icon={ImageIcon} badge={imageCount} onPress={pick}>
      Foto
    </NavButton>
  );
}

/** Rodapé: contagem + privacidade + ferramentas de TCC. */
function Dock() {
  return (
    <VStack className="bg-white border-t border-[#E6E8EC] pt-2 pb-1">
      <HStack className="justify-between px-5 pb-1.5 items-center">
        <WordCount />
        <HStack className="items-center gap-1">
          <Lock size={11} color="#9AA0AA" />
          <Text className="text-xs font-subtitle text-[#9AA0AA]">Salvo só neste aparelho</Text>
        </HStack>
      </HStack>
      <HStack className="px-2 items-center justify-around w-full">
        <EmotionsDrawer />
        <ThoughtsDrawer />
        <ReactionsDrawer />
        <BehaviorsDrawer />
        <PhotoButton />
      </HStack>
    </VStack>
  );
}

/* ---------------------------------------------------------------- Exports */

export const Composer = {
  Provider: ComposerProvider,
  Frame,
  Header,
  Close,
  DateTitle,
  Submit,
  MoodRow,
  Body,
  AuthorRow,
  Editor,
  Media,
  ChipStrip,
  Dock,
};
