import { ImageCarousel } from "@/components/image-carousel";
import NoteBodyShell from "@/components/note/note-body";
import { BehaviorReportBlock } from "@/components/note/note-body/behavior-report-block";
import Content from "@/components/note/note-body/content";
import NoteTagsShell from "@/components/note/note-body/note-tags";
import BehaviorTags from "@/components/note/note-body/note-tags/behavior-tags";
import EmotionTags from "@/components/note/note-body/note-tags/emotion-tags";
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
import { Avatar, AvatarFallbackText } from "@/components/ui/avatar";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { useAuthStore } from "@/stores/auth-store";
import { getNoteBody, useNoteStore } from "@/stores/note-store";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link, useRouter } from "expo-router";
import { ArrowLeft, CornerDownRight } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ViewNotePage() {

  const insets = useSafeAreaInsets()
  const router = useRouter()

  const note = useNoteStore(n => n.viewNote)

  const { images, reports } = getNoteBody(note);
  const user = useAuthStore(e => e.user)


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
            <VStack>
              <Text className="text-base font-heading text-zinc-900">
                Nota
              </Text>
              <Text className="text-xs font-subtitle text-zinc-500">
                Nota do diário
              </Text>
            </VStack>
          </HStack>
        </HStack>
      </View>

      <NoteShell note={note} >
        {note.fixed && <Fixed />}
        {note.isRepost && <Repost />}
        <NoteHeader>
          <Author />
          <Actions />
        </NoteHeader>
        <NoteBodyShell>
          {note.content.length > 0 && <Content />}
          <ImageCarousel images={images} />
          <NoteTagsShell>
            <ThoughtTags />
            <EmotionTags />
            <ReactionTags />
            <BehaviorTags />
          </NoteTagsShell>
          {reports.map(behavior => (
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
      <VStack className="flex-1 p-3">
        <HStack space="md" className="">
          <Avatar className="bg-zinc-100 border border-gray-200">
            <AvatarFallbackText className="text-zinc-900 font-heading">
              {user?.firstName?.charAt(0) || "U"}
            </AvatarFallbackText>
          </Avatar>
          <NoteContextProvider note={note}>
            <VStack className="flex-1 border-zinc-200 bg-white border rounded-md p-2">
              <NoteHeader>
                <VStack className="flex-1 justify-center">
                  <HStack className="items-center gap-1.5 flex-wrap">
                    <Text
                      className="text-base font-heading text-zinc-900"
                      numberOfLines={1}
                    >
                      {user?.firstName} {user?.secondName}
                    </Text>
                    <Text className="text-sm capitalize text-center font-subtitle text-gray-500">
                      {format(note.date, "MMM dd", { locale: ptBR })}
                    </Text>
                  </HStack>
                </VStack>            </NoteHeader>
              <NoteBodyShell>
                {note.content.length > 0 && <Content />}
                <ImageCarousel images={images} />
                <NoteTagsShell>
                  <ThoughtTags />
                  <EmotionTags />
                  <ReactionTags />
                  <BehaviorTags />
                </NoteTagsShell>
                {reports.map(behavior => (
                  <BehaviorReportBlock key={behavior.id} text={behavior.content} />
                ))}
              </NoteBodyShell>

            </VStack>
          </NoteContextProvider>
        </HStack>
      </VStack>
      <View
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
      </View>

    </VStack>
  );
}
