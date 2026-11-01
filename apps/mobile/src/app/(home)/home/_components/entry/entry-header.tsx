import { Avatar, AvatarFallback, AvatarFallbackText, AvatarImage } from "@/components/ui/avatar"
import { Drawer, DrawerBackdrop, DrawerBody, DrawerCloseButton, DrawerContent, DrawerHeader } from "@/components/ui/drawer"
import { HStack } from "@/components/ui/hstack"
import { CloseIcon, Icon } from "@/components/ui/icon"
import { VStack } from "@/components/ui/vstack"
import { useAuthStore } from "@/stores/auth-store"
import { useEntryStore } from "@/stores/journal-store"
import { EllipsisVerticalIcon, HeartIcon, PencilIcon, PinIcon, RefreshCcw, ReplyIcon, TrashIcon } from "lucide-react-native"
import { useState } from "react"
import { Pressable, Text } from "react-native"

interface Props {
  entryId: number
  liked: boolean
}

export default function EntryHeader({ entryId, liked }: Props) {
  const { user } = useAuthStore()
  const deleteEntry = useEntryStore(e => e.deleteEntry)
  const updateEntry = useEntryStore(e => e.updateEntry)
  const [open, setOpen] = useState(false)

  return (
    <HStack className="justify-between" space="lg">
      <HStack space="md">
        <Avatar>
          <AvatarImage />
          <AvatarFallback>
            <AvatarFallbackText>
              {user?.firstName}
            </AvatarFallbackText>
          </AvatarFallback>
        </Avatar>
        <VStack>
          <Text className="text-sm font-semibold">
            {user?.firstName} {user?.secondName}
          </Text>
          <Text className="text-sm text-gray-500">
            @{user?.username}
          </Text>
        </VStack>
      </HStack>
      <Pressable className="justify-center p-2" onPress={() => setOpen(true)}>
        <EllipsisVerticalIcon size={16} color="gray" />
      </Pressable>
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
                <Text className="font-semibold text-gray-900">
                  Responder
                </Text>
              </Pressable>
              <Pressable className="flex-row items-center gap-3 p-4 active:bg-zinc-100 rounded-xl">
                <RefreshCcw size={20} color="gray" />
                <Text className="font-semibold text-gray-900">
                  Republicar
                </Text>
              </Pressable>
              <Pressable onPress={() => updateEntry(entryId, { liked: !liked })} className="flex-row items-center gap-3 p-4 active:bg-zinc-100 rounded-xl">
                <HeartIcon fill={liked ? "black" : "none"}
                  strokeWidth={liked ? 0 : 2}
                  size={20} color="gray" />
                <Text className="font-semibold text-gray-900">
                  {liked ? "Desfavoritar" : "Favoritar"}
                </Text>
              </Pressable>
              <Pressable className="flex-row items-center gap-3 p-4 active:bg-zinc-100 rounded-xl">
                <PinIcon size={20} color="gray" />
                <Text className="font-semibold text-gray-900">
                  Fixar
                </Text>
              </Pressable>
              <Pressable className="flex-row items-center gap-3 p-4 active:bg-zinc-100 rounded-xl">
                <PencilIcon size={20} color="gray" />
                <Text className="font-semibold text-gray-900">
                  Editar
                </Text>
              </Pressable>
              <Pressable onPress={() => deleteEntry(entryId)} className="flex-row items-center gap-3 p-4 active:bg-zinc-100 rounded-xl">
                <TrashIcon size={20} color="#ef4444" />
                <Text className="font-semibold text-red-500">
                  Excluir
                </Text>
              </Pressable>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      )}
    </HStack >
  )
}
