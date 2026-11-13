interface SubmitProps {
  children: string;
  pendingLabel?: string;
}

function Submit({ children, pendingLabel = "Salvando..." }: SubmitProps) {
  const { submit } = useComposerActions();
  const isSaving = useComposer((s) => s.isSaving);
  // Booleano derivado: não re-renderiza a cada letra digitada.
  const isEmpty = useComposer((s) => s.content.trim().length === 0);
  const disabled = isSaving || isEmpty;

  return (
    <Pressable
      onPress={submit}
      disabled={disabled}
      className={`h-9 px-4 rounded-full items-center justify-center ${disabled ? "bg-muted" : "bg-primary active:opacity-85"
        }`}
    >
      <Text numberOfLines={1} className="text-primary-foreground font-semibold text-[13.5px]">
        {isSaving ? pendingLabel : children}
      </Text>
    </Pressable>
  );
}
