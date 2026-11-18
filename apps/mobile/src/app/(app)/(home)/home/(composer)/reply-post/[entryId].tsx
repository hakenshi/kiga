import { Text } from "@/components/ui/text";
//
// function formatParentTime(rawDate?: Date | string | number | null) {
//   if (!rawDate) return "";
//   const d = new Date(rawDate);
//   const now = new Date();
//   const isToday =
//     d.getDate() === now.getDate() &&
//     d.getMonth() === now.getMonth() &&
//     d.getFullYear() === now.getFullYear();
//
//   const timeStr = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
//   if (isToday) return `Hoje · ${timeStr}`;
//
//   const dayMonth = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
//   return `${dayMonth} · ${timeStr}`;
// }
//
export default function ReplyPostPage() {
  // const router = useRouter();
  // const { entryId } = useLocalSearchParams<{ entryId: string }>();
  // const user = useAuthStore((s) => s.user);
  // const addNote = useNoteStore((s) => s.addNote);
  //
  // const [rootEntry, setRootEntry] = useState<Note | null>(null);
  // const [existingRepliesCount, setExistingRepliesCount] = useState(0);
  // const [isLoadingThread, setIsLoadingThread] = useState(true);
  //
  // useEffect(() => {
  //   if (!entryId) return;
  //   const numId = Number(entryId);
  //   useComposerDraftStore.getState().reset();
  //   setIsLoadingThread(true);
  //   NoteRepository.getThread(numId)
  //     .then((thread) => {
  //       if (thread) {
  //         setRootEntry(thread.rootEntry);
  //         setExistingRepliesCount(thread.replies.length);
  //       }
  //     })
  //     .finally(() => setIsLoadingThread(false));
  // }, [entryId]);
  //
  // const actions = {
  //   close: () => {
  //     useComposerDraftStore.getState().reset();
  //     if (router.canGoBack()) {
  //       router.back();
  //     } else {
  //       router.push("/(home)/home");
  //     }
  //   },
  //   submit: async () => {
  //     const state = useComposerDraftStore.getState();
  //     if (!state.content.trim()) return;
  //     if (!rootEntry) return;
  //
  //     useComposerDraftStore.setState({ isSaving: true });
  //     try {
  //       const newReply = await NoteRepository.createReply({
  //         userId: user!.id,
  //         parentEntryId: rootEntry.id,
  //         content: state.content,
  //         moodId: state.moodId,
  //         emotions: state.emotions,
  //         thoughts: state.thoughts,
  //         reactions: state.reactions,
  //         behaviors: state.behaviors,
  //         images: state.images,
  //         date: state.entryDate,
  //       });
  //
  //       addNote(newReply);
  //       state.reset();
  //       useToastStore.getState().showInfo("Reflexão adicionada à linha do tempo.");
  //       if (router.canGoBack()) {
  //         router.back();
  //       } else {
  //         router.push(`/(home)/home/view-post/${rootEntry.id}`);
  //       }
  //     } catch (err) {
  //       useToastStore.getState().showError("Falha ao salvar a reflexão.", err);
  //       useComposerDraftStore.setState({ isSaving: false });
  //     }
  //   },
  // };
  //
  // const parentMood = resolveMoodConfig(rootEntry ?? undefined);
  // const stepNumber = existingRepliesCount + 1;
  // const parentAuthorName = rootEntry?.userId === user?.id
  //   ? `${user?.firstName ?? ""} ${user?.secondName ?? ""}`.trim()
  //   : "Autor do pensamento";
  //
  // const parentThoughts = (rootEntry?.noteThoughts ?? [])
  //   .map((t) => t.thought?.name)
  //   .filter(Boolean);
  // const parentEmotions = (rootEntry?.noteEmotions ?? [])
  //   .map((e) => e.emotion?.name)
  //   .filter(Boolean);
  //
  return (
    <Text>
      wip
    </Text>
  );
}
