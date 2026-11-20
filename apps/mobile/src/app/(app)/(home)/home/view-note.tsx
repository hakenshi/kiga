import { ImageCarousel } from "@/components/image-carousel";
import NoteBodyShell from "@/components/note/note-body";
import { BehaviorReportBlock } from "@/components/note/note-body/behavior-report-block";
import Content from "@/components/note/note-body/content";
import NoteTagsShell from "@/components/note/note-body/note-tags";
import BehaviorTags from "@/components/note/note-body/note-tags/behavior-tags";
import EmotionTags from "@/components/note/note-body/note-tags/emotion-tags";
import MoodTags from "@/components/note/note-body/note-tags/mood-tags";
import ReactionTags from "@/components/note/note-body/note-tags/reaction-tags";
import ThoughtTags from "@/components/note/note-body/note-tags/thought-tags";
import NoteContextProvider from "@/components/note/note-context";
import NoteFooterShell from "@/components/note/note-footer";
import ContinueButton from "@/components/note/note-footer/continue-button";
import KeepButton from "@/components/note/note-footer/keep-button";
import NoteHeader from "@/components/note/note-header";
import Actions from "@/components/note/note-header/actions";
import Author from "@/components/note/note-header/author";
import Fixed from "@/components/note/note-header/fixed";
import Repost from "@/components/note/note-header/repost";
import NoteShell from "@/components/note/note-shell";
import { RepostDrawer } from "@/components/note/repost-drawer";
import { Drawer, DrawerBackdrop, DrawerBody, DrawerCloseButton, DrawerContent, DrawerHeader } from "@/components/ui/drawer";
import { HStack } from "@/components/ui/hstack";
import { CloseIcon, Icon } from "@/components/ui/icon";
import { VStack } from "@/components/ui/vstack";
import { useAuthStore } from "@/stores/auth-store";
import { useViewedNote } from "@/queries/notes/queries";
import { differenceInDays, format, intervalToDuration } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, CornerDownRight, PencilIcon, TrashIcon } from "lucide-react-native";
import { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
function formatDifference(start: Date, end: Date): string {
  const days = differenceInDays(end, start)

  if (days > 1) {
    return `${days} dia${days === 1 ? "" : "s"} depois`
  }
  const { hours = 0, minutes = 0 } = intervalToDuration({
    start, end
  })

  if (hours > 0 && minutes > 0) {
    return `+${hours}h ${minutes}m depois`
  }

  if (hours > 0) {
    return `+${hours}h depois`
  }

  return `+${minutes}m depois`
}
export default function ViewNotePage() {

  const insets = useSafeAreaInsets()
  const router = useRouter()

  const { noteId } = useLocalSearchParams<{ noteId: string }>();
  const userId = useAuthStore(e => e.user!.id);
  const { note } = useViewedNote(userId, noteId);
  const [open, setOpen] = useState(false);

  if (!note) {
    return (
      <View className="flex-1 notes-center justify-center bg-white">
        <Text>Nota não encontrada</Text>
        <Pressable onPress={() => router.back()}><Text>Voltar</Text></Pressable>
      </View>
    );
  }

  return (
    <VStack className="flex-1 bg-zinc-50">
      <View
        style={{ paddingTop: insets.top }}
        className="bg-white border-b border-zinc-200"
      >
        <HStack className="px-4 h-14 notes-center justify-between">
          <HStack className="notes-center gap-3">
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              className="w-9 h-9 rounded-full notes-center justify-center active:bg-zinc-100"
            >
              <ArrowLeft size={20} color="#18181B" />
            </Pressable>
            <Text className="font-heading mt-1 text-zinc-900">
              Thread
            </Text>
          </HStack>
        </HStack>
      </View>

      <FlatList
        className="flex-1"
        data={note.thread}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: insets.bottom + 72 }}
        ListHeaderComponent={
          <>
            <NoteShell note={note}>
              {note.fixed && <Fixed />}
              {note.isRepost && <Repost />}
              <NoteHeader>
                <Author />
                <Actions />
              </NoteHeader>
              <NoteBodyShell>
                {note.content.length > 0 && <Content />}
                <ImageCarousel images={note.noteImages} />
                <NoteTagsShell>
                  <ThoughtTags size="xs" />
                  <EmotionTags size="xs" />
                  <ReactionTags size="xs" />
                  <BehaviorTags size="xs" />
                </NoteTagsShell>
                {note.noteBehaviors.map(({ behavior }) => (
                  behavior.content &&
                  <BehaviorReportBlock key={behavior.id} text={behavior.content} />
                ))}
              </NoteBodyShell>
              <NoteFooterShell>
                <HStack space="sm">
                  <ContinueButton
                    onPress={() => {
                      router.push(`/home/reply-note/${note.id}`)
                    }}
                  />
                  <RepostDrawer />
                  <KeepButton />
                </HStack>
              </NoteFooterShell>
            </NoteShell>
          </>
        }
        renderItem={({ item: { reply }, index }) => {

          const differnce = formatDifference(note.date, reply.date)
          const isLast = index === note.thread.length - 1


          return (
            <>
              <Pressable onLongPress={() => setOpen(true)}>
                <HStack space="md" className={`px-3 ${index === 0 ? "pt-4" : ""}`}>
                  <VStack className="items-center">
                    <View className="bg-black size-7 items-center justify-center rounded-full">
                      <Text className="text-white text-sm font-semibold">
                        {index + 1}
                      </Text>
                    </View>
                    {!isLast && (
                      <View className="w-0.5 flex-1 bg-zinc-200 my-1.5" />
                    )}
                  </VStack>
                  <NoteContextProvider note={reply}>
                    <VStack className="flex-1 mb-4 border-zinc-200 bg-white border rounded-xl p-2 " space="md">
                      <NoteHeader>
                        <VStack className="flex-1 justify-center">
                          <HStack className="items-center gap-1.5 justify-between flex-wrap">
                            <View className="flex-row gap-2">
                              <Text className="text-zinc-700 text-sm font-semibold">
                                {differnce}
                              </Text>
                              <Text className="text-zinc-700 capitalize text-sm font-semibold">
                                {format(reply.date, "E - HH:mm", { locale: ptBR })}
                              </Text>
                            </View>
                            <MoodTags />
                          </HStack>
                        </VStack>
                      </NoteHeader>
                      <NoteBodyShell>
                        {reply.content.length > 0 && <Content />}
                        {reply.noteImages.length > 0 && <ImageCarousel images={reply.noteImages} />}
                        <NoteTagsShell>
                          <ThoughtTags />
                          <EmotionTags />
                          <ReactionTags />
                          <BehaviorTags />
                        </NoteTagsShell>
                        {reply.noteBehaviors.map(({ behavior }) => (
                          behavior.content && <BehaviorReportBlock key={behavior.id} text={behavior.content} />
                        ))}
                      </NoteBodyShell>
                    </VStack>
                  </NoteContextProvider>
                </HStack >
              </Pressable>
              <Drawer
                isOpen={open}
                onClose={() => setOpen(false)}
                size="sm"
              >
                <DrawerBackdrop />
                <DrawerContent>
                  <DrawerHeader className="justify-between flex-row">
                    <Text>
                      Editando Thread
                    </Text>
                    <DrawerCloseButton>
                      <Icon as={CloseIcon} />
                    </DrawerCloseButton>
                  </DrawerHeader>
                  <DrawerBody>
                    <Pressable className="flex-row items-center gap-3 p-4 active:bg-zinc-100 rounded-xl">

                      <PencilIcon size={20} color="gray" />
                      <Text className="font-semibold text-gray-900">Editar</Text>

                    </Pressable>
                    <Pressable
                      className="flex-row items-center gap-3 p-4 active:bg-zinc-100 rounded-xl"
                    >
                      <TrashIcon size={20} color="#ef4444" />
                      <Text className="font-semibold text-red-500">Excluir</Text>
                    </Pressable>

                  </DrawerBody>
                </DrawerContent>
              </Drawer>
            </>
          )
        }}
      />

      < View
        style={{ paddingBottom: insets.bottom + 8 }}
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-zinc-200 px-4 pt-2.5"
      >
        <Link href={`/home/reply-note/${note.id}`} push asChild>
          <Pressable className="bg-zinc-100 rounded-full px-4 py-2.5 flex-row notes-center justify-between active:opacity-75">
            <Text className="text-xs text-zinc-500 font-subtitle">
              Continuar esta nota...
            </Text>
            <CornerDownRight size={15} color="#18181B" />
          </Pressable>
        </Link>
      </View >

    </VStack >
  );
}
