import { Image } from "expo-image"

interface Props {
  size?: "sm" | "md" | "lg" | "xl"
}

const sizes = {
  sm: 40,
  md: 80,
  lg: 120,
  xl: 160,
  "2xl": 200
}
export default function Logo({ size }: Props) {
  return (
    <Image
      source={require("../../../assets/images/kiga-logo.jpg")}
      style={{ width: size ? sizes[size] : 160, height: size ? sizes[size] : 160, borderRadius: 20 }}
      contentFit="contain"
    />

  )
}
