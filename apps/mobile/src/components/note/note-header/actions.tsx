import { Drawer, DrawerBackdrop, DrawerContent, DrawerHeader, DrawerCloseButton, DrawerBody } from "@/components/ui/drawer";
import { HStack } from "@/components/ui/hstack";
import { CloseIcon, Icon } from "@/components/ui/icon";
import { useEditNoteCacheStore } from "@/stores/edit-note-cache-store";
import { useNoteStore } from "@/stores/note-store";
import { useRouter } from "expo-router";
import { EllipsisVerticalIcon, Eye, ReplyIcon, HeartIcon, PinIcon, PencilIcon, TrashIcon } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text } from "react-native";
import { useNote } from "../note-context";
export default function Actions() {
  const deleteNote = useNoteStore((e) => e.deleteNote);
  const updateNote = useNoteStore((e) => e.updateNote);
  const findNote = useNoteStore(e => e.findNote)
  const loadEditNote = useEditNoteCacheStore(e => e.load)
  const setViewNote = useNoteStore(e => e.setViewNote)
  const { note } = useNote()
  const { id: noteId, liked, fixed } = note
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const navigate = async () => {
    const note = await findNote(noteId)
    if (!note) return
    loadEditNote(note)
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
                  setViewNote(note);
                  router.push("/home/view-note");
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
                onPress={() => updateNote(noteId, { liked: !liked })}
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
              <Pressable onPress={() => updateNote(noteId, { fixed: !fixed })} className="flex-row items-center gap-3 p-4 active:bg-zinc-100 rounded-xl">

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
                  deleteNote(noteId);
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
