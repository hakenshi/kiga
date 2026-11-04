import { Avatar, AvatarFallbackText, AvatarImage } from "@/components/ui/avatar";
import {
  Drawer,
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
} from "@/components/ui/drawer";
import { HStack } from "@/components/ui/hstack";
import { CloseIcon, Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAuthStore } from "@/stores/auth-store";
import { useEntryStore } from "@/stores/journal-store";
import { useEditPostStore } from "@/stores/edit-post-store";
import { useRouter } from "expo-router";
import {
  Angry,
  EllipsisVerticalIcon,
  Frown,
  HeartIcon,
  Laugh,
  Meh,
  PencilIcon,
  Pin,
  PinIcon,
  RefreshCcw,
  ReplyIcon,
  Smile,
  TrashIcon,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";

interface Props {
  entry?: JournalEntryWithRelations;
  entryId: number;
  liked: boolean;
  fixed: boolean
}

interface MoodStyleConfig {
  label: string;
  Icon: LucideIcon;
  bg: string;
  border: string;
  color: string;
}

const MOOD_BY_ID: Record<number, MoodStyleConfig> = {
  1: {
    label: "Muito Mal",
    Icon: Angry,
    bg: "#FEF2F2",
    border: "#FECACA",
    color: "#B91C1C",
  },
  2: {
    label: "Mal",
    Icon: Frown,
    bg: "#FFF7ED",
    border: "#FED7AA",
    color: "#C2410C",
  },
  3: {
    label: "Neutro",
    Icon: Meh,
    bg: "#F4F4F5",
    border: "#E4E4E7",
    color: "#52525B",
  },
  4: {
    label: "Bem",
    Icon: Smile,
    bg: "#F0FDF4",
    border: "#BBF7D0",
    color: "#15803D",
  },
  5: {
    label: "Muito Bem",
    Icon: Laugh,
    bg: "#ECFDF5",
    border: "#A7F3D0",
    color: "#047857",
  },
};

function resolveMoodConfig(entry?: JournalEntryWithRelations): MoodStyleConfig | null {
  const moodId = entry?.moodId ?? entry?.mood?.id;
  const moodName = entry?.mood?.name?.trim();

  if (moodId && MOOD_BY_ID[moodId]) {
    const base = MOOD_BY_ID[moodId];
    return {
      ...base,
      label: moodName || base.label,
    };
  }

  if (moodName) {
    const lower = moodName.toLowerCase();
    if (lower.includes("muito mal")) return { ...MOOD_BY_ID[1], label: moodName };
    if (lower.includes("mal")) return { ...MOOD_BY_ID[2], label: moodName };
    if (lower.includes("muito bem")) return { ...MOOD_BY_ID[5], label: moodName };
    if (lower.includes("bem")) return { ...MOOD_BY_ID[4], label: moodName };
    return { ...MOOD_BY_ID[3], label: moodName };
  }

  return null;
}

function formatEntryDate(rawDate?: Date | string | number | null): string {
  if (!rawDate) return "";
  const date = rawDate instanceof Date ? rawDate : new Date(rawDate);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const isSameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const timeStr = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isSameDay) {
    return `Hoje · ${timeStr}`;
  }

  const dayMonth = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  }).replace(".", "");

  return `${dayMonth} · ${timeStr}`;
}

export default function EntryHeader({ entry, entryId, liked, fixed = false }: Props) {
  const { user } = useAuthStore();
  const deleteEntry = useEntryStore((e) => e.deleteEntry);
  const updateEntry = useEntryStore((e) => e.updateEntry);
  const startEditing = useEditPostStore((s) => s.startEditing);
  const [open, setOpen] = useState(false);

  const moodConfig = resolveMoodConfig(entry);
  const formattedDate = formatEntryDate(entry?.date ?? entry?.createdAt);

  const router = useRouter();

  return (
    <>

      {fixed && (
        <HStack className="justify-end" space="xs">
          <Pin size={14} color={"#99a1af"} />
          <Text className="font-semibold text-xs text-gray-400">
            Fixado
          </Text>
        </HStack>
      )}
      <HStack className="justify-between items-start" space="md">
        <HStack space="sm" className="items-center flex-1 pr-2">
          <Avatar className="bg-[#F4F4F5] border border-[#E6E8EC]">
            <AvatarImage />
            <AvatarFallbackText className="text-[#111318] font-heading">
              {user?.firstName}
            </AvatarFallbackText>
          </Avatar>
          <VStack className="flex-1">
            <HStack className="items-center gap-1.5 flex-wrap">
              <Text
                className="text-[15px] font-heading text-[#111318]"
                numberOfLines={1}
              >
                {user?.firstName} {user?.secondName}
              </Text>

            </HStack>
            <HStack className="items-center" space="xs">
              <Text className="text-[13px] font-subtitle text-[#68707C]">
                @{user?.username}
              </Text>
              {formattedDate ? (
                <>
                  <Text className="text-xs font-subtitle text-[#9AA0AA]">·</Text>
                  <Text className="text-xs font-subtitle text-[#8E95A2]">
                    {formattedDate}
                  </Text>
                </>
              ) : null}

            </HStack>
          </VStack>
        </HStack>

        <HStack className="items-center gap-1.5">
          {moodConfig && (
            <View
              className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full border"
              style={{
                backgroundColor: moodConfig.bg,
                borderColor: moodConfig.border,
              }}
            >
              <moodConfig.Icon size={13} color={moodConfig.color} strokeWidth={2.2} />
              <Text
                className="text-[11px] font-subtitle-semibold"
                style={{ color: moodConfig.color }}
              >
                {moodConfig.label}
              </Text>
            </View>
          )}

          <Pressable
            hitSlop={8}
            className="justify-center items-center w-8 h-8 rounded-full active:bg-zinc-100"
            onPress={() => setOpen(true)}
          >
            <EllipsisVerticalIcon size={16} color="#68707C" />
          </Pressable>
        </HStack>

        {open && (
          <Drawer anchor="bottom" isOpen={open} onClose={() => setOpen(false)} size="md">
            <DrawerBackdrop />
            <DrawerContent>
              <DrawerHeader>
                <DrawerCloseButton>
                  <Icon as={CloseIcon} className="stroke-foreground" />
                </DrawerCloseButton>
              </DrawerHeader>
              <DrawerBody className="gap-1 pb-6">
                <Pressable className="flex-row items-center gap-3 p-4 active:bg-zinc-100 rounded-xl">
                  <PencilIcon size={20} color="gray" />
                  <Text className="font-semibold text-gray-900">
                    Visualizar pensamento
                  </Text>
                </Pressable>
                <Pressable className="flex-row items-center gap-3 p-4 active:bg-zinc-100 rounded-xl">
                  <ReplyIcon size={20} color="gray" />
                  <Text className="font-semibold text-gray-900">Responder</Text>
                </Pressable>
                <Pressable className="flex-row items-center gap-3 p-4 active:bg-zinc-100 rounded-xl">
                  <RefreshCcw size={20} color="gray" />
                  <Text className="font-semibold text-gray-900">Republicar</Text>
                </Pressable>
                <Pressable
                  onPress={() => updateEntry(entryId, { liked: !liked })}
                  className="flex-row items-center gap-3 p-4 active:bg-zinc-100 rounded-xl"
                >
                  <HeartIcon
                    fill={liked ? "#EF4444" : "none"}
                    strokeWidth={liked ? 0 : 2}
                    size={20}
                    color={liked ? "#EF4444" : "gray"}
                  />
                  <Text className="font-semibold text-gray-900">
                    {liked ? "Desfavoritar" : "Guardar"}
                  </Text>
                </Pressable>
                <Pressable onPress={() => updateEntry(entryId, { fixed: !fixed })} className="flex-row items-center gap-3 p-4 active:bg-zinc-100 rounded-xl">

                  <PinIcon size={20} color="gray" />
                  <Text className="font-semibold text-gray-900">
                    {fixed ? "Desfixar" : "Fixar"}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setOpen(false);
                    if (entry) {
                      startEditing(entry);
                    }
                    router.push(`/home/edit-post/${entryId}`);
                  }}
                  className="flex-row items-center gap-3 p-4 active:bg-zinc-100 rounded-xl"
                >
                  <PencilIcon size={20} color="gray" />
                  <Text className="font-semibold text-gray-900">Editar</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setOpen(false);
                    deleteEntry(entryId);
                  }}
                  className="flex-row items-center gap-3 p-4 active:bg-zinc-100 rounded-xl"
                >
                  <TrashIcon size={20} color="#ef4444" />
                  <Text className="font-semibold text-red-500">Excluir</Text>
                </Pressable>
              </DrawerBody>
            </DrawerContent>
          </Drawer>
        )}
      </HStack>

    </>);
}
