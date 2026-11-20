import { Drawer, DrawerBackdrop, DrawerContent, DrawerHeader, DrawerCloseButton, DrawerBody } from "@/components/ui/drawer";
import { HStack } from "@/components/ui/hstack";
import { CloseIcon, Icon } from "@/components/ui/icon";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loadEditNote, noteMutations } from "@/queries/notes/queries";
import { useRouter } from "expo-router";
import { EllipsisVerticalIcon, Eye, ReplyIcon, HeartIcon, PinIcon, PencilIcon, TrashIcon } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text } from "react-native";
import { useNote } from "../note-context";
export default function Actions() {
  const { note } = useNote()
  const client = useQueryClient();
  const update = useMutation(noteMutations.update(client, note.userId));
  const remove = useMutation(noteMutations.remove(client, note.userId));
  const { id: noteId, liked, fixed } = note
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const navigate = async () => {
    if (!await loadEditNote(client, note.userId, noteId)) return;
    setOpen(false);
    router.push(`/home/edit-note/${noteId}`);
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
                  router.push({ pathname: "/home/view-note", params: { noteId } });
                }}
                className="flex-row items-center gap-3 p-4 active:bg-zinc-100 rounded-xl"
              >
                <Eye size={20} color="gray" />
                <Text className="font-semibold text-gray-900">
                  Visualizar nota
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setOpen(false);
                  router.push(`/home/reply-note/${noteId}`);
                }}
                className="flex-row items-center gap-3 p-4 active:bg-zinc-100 rounded-xl"
              >
                <ReplyIcon size={20} color="gray" />
                <Text className="font-semibold text-gray-900">Responder</Text>
              </Pressable>
              <Pressable
                onPress={() => update.mutate({ noteId, data: { liked: !liked } })}
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
              <Pressable onPress={() => update.mutate({ noteId, data: { fixed: !fixed } })} className="flex-row items-center gap-3 p-4 active:bg-zinc-100 rounded-xl">

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
                  remove.mutate(noteId);
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
