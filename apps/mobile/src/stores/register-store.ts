import { create } from "zustand";
import type { Gender, Pronoun } from "@/lib/db/schema";

export interface RegisterState {
  // Etapa 1: Nome e Identificação
  firstName: string;
  secondName: string;
  username: string;
  birthDate: string;

  // Etapa 2: Segurança
  password: string;
  confirmPassword: string;

  // Etapa 3: Identidade
  gender?: Gender;
  pronoun?: Pronoun;

  // Etapa 4: PIN
  pin: string;

  // Actions
  setStep1Data: (data: {
    firstName: string;
    secondName: string;
    username: string;
    birthDate: string;
  }) => void;
  setStep2Data: (data: {
    password: string;
    confirmPassword: string;
  }) => void;
  setStep3Data: (data: {
    gender?: Gender;
    pronoun?: Pronoun;
  }) => void;
  setPin: (pin: string) => void;
  reset: () => void;
}

const initialState = {
  firstName: "",
  secondName: "",
  username: "",
  birthDate: "",
  password: "",
  confirmPassword: "",
  gender: undefined,
  pronoun: undefined,
  pin: "",
};

export const useRegisterStore = create<RegisterState>((set) => ({
  ...initialState,

  setStep1Data: (data) => set((state) => ({ ...state, ...data })),
  setStep2Data: (data) => set((state) => ({ ...state, ...data })),
  setStep3Data: (data) => set((state) => ({ ...state, ...data })),
  setPin: (pin) => set({ pin }),
  reset: () => set(initialState),
}));
