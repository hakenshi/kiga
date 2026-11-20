import { Button, ButtonText } from "@/components/ui/button";

interface SaveButtonProps {
  submit: VoidFunction
  disabled: boolean
}

export default function SaveButton({ submit, disabled }: SaveButtonProps) {
  return (

    <Button onPress={submit} disabled={disabled}>
      <ButtonText>Salvar</ButtonText>
    </Button>
  )
}
