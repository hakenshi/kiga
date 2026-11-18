import { Drawer, DrawerBackdrop, DrawerContent, DrawerHeader, DrawerCloseButton, DrawerBody } from "@/components/ui/drawer";
import { HStack } from "@/components/ui/hstack";
import { CloseIcon, Icon } from "@/components/ui/icon";
import { useEntryCacheStore } from "@/stores/entry-cache-store";
import { useNoteStore } from "@/stores/note-store";
import { useRouter } from "expo-router";
import { EllipsisVerticalIcon, Eye, ReplyIcon, HeartIcon, PinIcon, PencilIcon, TrashIcon } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text } from "react-native";


interface Props {
  entryId: number
  liked: boolean
  fixed: boolean
}

export default function Actions({ entryId, fixed, liked }: Props) {
  const deleteNote = useNoteStore((e) => e.deleteNote);
  const updateNote = useNoteStore((e) => e.updateNote);
  const findNote = useNoteStore(e => e.findNote)
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const navigate = async () => {
    const entry = await findNote(entryId)
    if (!entry) return
    useEntryCacheStore.getState().updateCachedEntry({
      date: entry.date,
      noteEmotions: entry.noteEmotions,
      noteType: entry.type
    })
    setOpen(false);
    router.push(`/home/edit-post/${entryId}`);
  }
  return (
    <>

      <HStack className="items-center gap-1.5">
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
                  router.push(`/home/view-post/${entryId}`);
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
                  router.push(`/home/reply-post/${entryId}`);
                }}
                className="flex-row items-center gap-3 p-4 active:bg-zinc-100 rounded-xl"
              >
                <ReplyIcon size={20} color="gray" />
                <Text className="font-semibold text-gray-900">Responder</Text>
              </Pressable>
              <Pressable
                onPress={() => updateNote(entryId, { liked: !liked })}
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
              <Pressable onPress={() => updateNote(entryId, { fixed: !fixed })} className="flex-row items-center gap-3 p-4 active:bg-zinc-100 rounded-xl">

                <PinIcon size={20} color="gray" />
                <Text className="font-semibold text-gray-900">
                  {fixed ? "Desfixar" : "Fixar"}
                </Text>
              </Pressable>
              <Pressable
                onPress={navigate}
                className="flex-row items-center gap-3 p-4 active:bg-zinc-100 rounded-xl"
              >
                <PencilIcon size={20} color="gray" />
                <Text className="font-semibold text-gray-900">Editar</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setOpen(false);
                  deleteNote(entryId);
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
    </>
  )
}
