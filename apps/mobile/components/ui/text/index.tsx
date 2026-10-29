import { Text as RNText, TextProps } from "react-native"

export const Text = ({ className = "", children, ...props }: TextProps) => {
  return (
    <RNText className={`${className} font-sans`} {...props}>
      {children}
    </RNText>
  )
}
