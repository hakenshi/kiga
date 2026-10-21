import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react-native"
import { PropsWithChildren } from "react"
import { ButtonText, Button, ButtonGroup } from "../ui/button"

interface AuthPagesButtonsProps extends React.PropsWithChildren {
  testId: string
  disabled: boolean
  onPress: VoidFunction
  variant?: "half" | "full"
}

export function AuthButtonBack({ disabled, testId, onPress, children, variant }: AuthPagesButtonsProps) {
  return (
    <Button
      testID={testId}
      className={variant === "half" ? "w-1/2" : "w-full"}
      onPress={onPress}
      disabled={disabled}
    >
      <ArrowLeftIcon color="white" size={16} />
      <ButtonText>
        {children}
      </ButtonText>
    </Button>
  )
}

export function AuthButtonNext({ disabled, testId, onPress, children, variant = "full" }: AuthPagesButtonsProps) {
  return (
    <Button
      testID={testId}
      className={variant === "half" ? "w-1/2" : "w-full"}
      onPress={onPress}
      disabled={disabled}
    >
      <ButtonText>
        {children}
      </ButtonText>
      <ArrowRightIcon color="white" size={16} />
    </Button>
  )
}

export function AuthButtonsContainer({ children }: PropsWithChildren) {
  return (
    <ButtonGroup className="pt-8">
      {children}
    </ButtonGroup>

  )
}

