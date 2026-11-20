import { ImageCarousel } from "@/components/image-carousel";
import NoteBodyShell from "@/components/note/note-body";
import { BehaviorReportBlock } from "@/components/note/note-body/behavior-report-block";
import Content from "@/components/note/note-body/content";
import NoteTagsShell from "@/components/note/note-body/note-tags";
import BehaviorTags from "@/components/note/note-body/note-tags/behavior-tags";
import EmotionTags from "@/components/note/note-body/note-tags/emotion-tags";
import ReactionTags from "@/components/note/note-body/note-tags/reaction-tags";
import ThoughtTags from "@/components/note/note-body/note-tags/thought-tags";
import NoteFooterShell from "@/components/note/note-footer";
import ContinueButton from "@/components/note/note-footer/continue-button";
import KeepButton from "@/components/note/note-footer/keep-button";
import NoteHeader from "@/components/note/note-header";
import Actions from "@/components/note/note-header/actions";
import Author from "@/components/note/note-header/author";
import Fixed from "@/components/note/note-header/fixed";
import Repost from "@/components/note/note-header/repost";
import NoteLinkShell from "@/components/note/note-link-shell";
import { RepostDrawer } from "@/components/note/repost-drawer";
import { Avatar, AvatarFallbackText, AvatarImage } from "@/components/ui/avatar";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { getNoteBody, useNotes } from "@/queries/notes/queries";
import { useAuthStore } from "@/stores/auth-store";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LinearGradient } from "expo-linear-gradient";
import { Link, router } from "expo-router";
import { PencilIcon } from "lucide-react-native";
import { FlatList, View } from "react-native";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const { notes, loadMore } = useNotes("")

  return (
    <FlatList
      className="flex-1 bg-zinc-100"
      data={notes}
      keyExtractor={item => String(item.id)}
      onEndReached={loadMore}
      ListHeaderComponent={
        <VStack className="bg-white">
          <LinearGradient
            className="flex-1 h-30"
            colors={["#18181B", "#27272A", "#3F3F46"]}
          />
          <HStack space="md" className="px-2 py-4 justify-between flex-1 border-t border-accent">
            <HStack space="md">
              <Avatar className="bg-black">
                <AvatarFallbackText className="text-white">
                  {user?.firstName}
                </AvatarFallbackText>
              </Avatar>
              <View>
                <Text className="font-semibold text-lg">
                  {user?.firstName} {user?.secondName}
                </Text>
                <Text className="text-sm text-zinc-500">
                  @{user?.username} - Desde {user ? format(user.createdAt, "MMM yyyy", { locale: ptBR }) : ""}
                </Text>
              </View>
            </HStack>
            <Link asChild href="/profile/edit">
              <Button size="md" variant="secondary" rounding="full">
                <ButtonIcon as={PencilIcon} />
                <ButtonText>
                  Editar Perfil
                </ButtonText>
              </Button>
            </Link>
          </HStack>
          <HStack space="md" className="items-center justify-evenly border-b border-accent px-2 py-4">
            <HStack space="xs">
              <Text className="font-bold">
                {notes.length}
              </Text>
              <Text className="font-normal text-zinc-500">
                Notas
              </Text>
            </HStack>
            <HStack space="xs">
              <Text className="font-bold">
                {notes.map(n => n.thread).length}
              </Text>
              <Text className="font-normal text-zinc-500">
                Threads
              </Text>
            </HStack>
            <HStack space="xs">
              <Text className="font-bold">
                {notes.length}
              </Text>
              <Text className="font-normal text-zinc-500">
                Guardadados
              </Text>
            </HStack>
            <HStack space="xs">
              <Text className="font-bold">
                {notes.length}
              </Text>
              <Text className="font-normal text-zinc-500">
                Mídias
              </Text>
            </HStack>
          </HStack>
        </VStack >
      }
      renderItem={({ item }) => {

        const { images, reports } = getNoteBody(item);
        return (
          <NoteLinkShell note={item} >
            {item.fixed && <Fixed />}
            {item.isRepost && <Repost />}
            <NoteHeader>
              <Author />
              <Actions />
            </NoteHeader>
            <NoteBodyShell>
              {item.content.length > 0 && <Content />}
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
                    router.push(`/home/reply-note/${item.id}`)
                  }}
                />
                <RepostDrawer />
                <KeepButton />
              </HStack>
            </NoteFooterShell>
          </NoteLinkShell>
        )
      }}
    />

  );
}
