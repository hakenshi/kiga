import { Stack } from "expo-router";
import FormStepContextProvider from "./FormStepContext";

export default function RegisterLayout() {
  return (
    <FormStepContextProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </FormStepContextProvider>
  )
}
