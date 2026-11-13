import { Avatar, AvatarFallbackText } from "@/components/ui/avatar";
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
import { useRouter } from "expo-router";
import {
  EllipsisVerticalIcon,
  Eye,
  HeartIcon,
  PencilIcon,
  Pin,
  PinIcon,
  RefreshCcw,
  ReplyIcon,
  TrashIcon,
} from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { RepostDrawer } from "./repost-drawer";

interface Props {
  entry: JournalEntry
}

import { resolveMoodConfig } from "@/lib/mood-utils";
import { formatEntryDate } from "@/lib/utils";

export default function EntryHeader({ entry }: Props) {
  const { user } = useAuthStore();
  const deleteEntry = useEntryStore((e) => e.deleteEntry);
  const updateEntry = useEntryStore((e) => e.updateEntry);
  const [editing, setEditing] = useState(false)
  const [open, setOpen] = useState(false);
  const [repostOpen, setRepostOpen] = useState(false);

  const isPureRepost = entry?.entryType === "repost" && !entry?.content?.trim();

  const moodConfig = resolveMoodConfig(displayEntry);
  const formattedDate = formatEntryDate(displayEntry?.date ?? displayEntry?.createdAt);

  const router = useRouter();

  return (
    <>
      {entry?.entryType === "repost" && (
        <HStack className="items-center gap-1.5 pb-0.5">
          <RefreshCcw size={12} color="#71717A" />
          <Text className="text-[11.5px] font-subtitle-medium text-zinc-500">
            Revisitou um momento
          </Text>
        </HStack>
      )}

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
            <AvatarFallbackText className="text-[#111318] font-heading">
              {user?.firstName?.charAt(0) || "U"}
            </AvatarFallbackText>
          </Avatar>
          <VStack className="flex-1">
            <HStack className="items-center gap-1.5 flex-wrap">
              <Text
                className="text-[15px] font-heading text-[#111318]"
                numberOfLines={1}
              >
                {`${user?.firstName ?? ""} ${user?.secondName ?? ""}`.trim() || "Você"}
              </Text>
            </HStack>
            <HStack className="items-center" space="xs">
              {user?.username ? (
                <Text className="text-[13px] font-subtitle text-[#68707C]">
                  @{user.username}
                </Text>
              ) : null}
              {formattedDate ? (
                <>
                  {user?.username ? (
                    <Text className="text-xs font-subtitle text-[#9AA0AA]">·</Text>
                  ) : null}
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
                <Pressable
                  onPress={() => {
                    setOpen(false);
                    const targetId = isPureRepost && parentEntry ? parentEntry.id : entryId;
                    router.push(`/(home)/home/view-post/${targetId}`);
                  }}
                  className="flex-row items-center gap-3 p-4 active:bg-zinc-100 rounded-xl"
                >
                  <Eye size={20} color="gray" />
                  <Text className="font-semibold text-gray-900">
                    Visualizar pensamento
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setOpen(false);
                    const targetId = isPureRepost && parentEntry ? parentEntry.id : entryId;
                    router.push(`/(home)/home/reply-post/${targetId}`);
                  }}
                  className="flex-row items-center gap-3 p-4 active:bg-zinc-100 rounded-xl"
                >
                  <ReplyIcon size={20} color="gray" />
                  <Text className="font-semibold text-gray-900">Responder</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setOpen(false);
                    setRepostOpen(true);
                  }}
                  className="flex-row items-center gap-3 p-4 active:bg-zinc-100 rounded-xl"
                >
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
                    {liked ? "Remover" : "Guardar"}
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

      <RepostDrawer
        isOpen={repostOpen}
        onClose={() => setRepostOpen(false)}
        entry={entry ?? ({ id: entryId } as any)}
      />
    </>);
}
