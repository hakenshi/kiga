
import { createContext, useContext, useState, PropsWithChildren, Dispatch, SetStateAction } from "react";

type FormContext = {
  formStep: number
  setFormStep: Dispatch<SetStateAction<number>>
}

const FormStepContext = createContext<FormContext | null>(null)

export default function FormStepContextProvider({ children }: PropsWithChildren) {
  const [formStep, setFormStep] = useState<number>(1)

  return <FormStepContext.Provider value={{ formStep, setFormStep }}>
    {children}
  </FormStepContext.Provider>
}

export const useFormStep = () => {

  const context = useContext(FormStepContext)

  if (!context) {
    throw new Error("Por favor use esse hook dentro do FormStepContext")
  }

  const { setFormStep, formStep } = context

  const increaseFormStep = () => setFormStep((f: number) => f + 1)
  const decreaseFormStep = () => setFormStep((f: number) => f - 1)

  return {
    currentFormStep: formStep,
    increaseFormStep,
    decreaseFormStep,
  }
}

