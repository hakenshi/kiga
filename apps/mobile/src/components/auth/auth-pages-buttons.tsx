import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react-native"
import { PropsWithChildren } from "react"
import { ButtonText, Button, ButtonGroup } from "../ui/button"
import { useRouter } from "expo-router"

interface AuthPagesButtonsProps extends React.PropsWithChildren {
  testId?: string
  disabled?: boolean
  onPress?: () => void | Promise<void>
  variant?: "half" | "full"
}

export function AuthButtonBack({ disabled, testId, onPress, children, variant }: AuthPagesButtonsProps) {
  const router = useRouter()
  return (
    <Button
      testID={testId}
      className={variant === "half" ? "w-1/2" : "w-full"}
      onPress={onPress ?? (() => router.back())}
      disabled={disabled}
      variant="secondary"
    >
      <ArrowLeftIcon size={16} />
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

