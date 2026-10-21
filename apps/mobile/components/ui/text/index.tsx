import { tva } from "@gluestack-ui/utils/nativewind-utils"
import { Text as RNText, TextProps } from "react-native"

export const Text = ({ className = "", children }: TextProps) => {
  return (
    <RNText className={tva(`${className} font-sans`)}>
      {children}
    </RNText>
  )
}
