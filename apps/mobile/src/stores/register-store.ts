import { format } from "date-fns";
import { create } from "zustand";

type RegisterState = {
  register: RegisterSchema["full"];
};

type RegisterActions = {
  getFormValues: () => RegisterSchema["input"];
  updateRegister: (user: RegisterSchema["output"]) => void;
  reset: () => void;
};

export const useRegisterStore = create<RegisterActions & RegisterState>((set, get) => ({
  register: {},
  getFormValues: () => {
    const { birthDate, ...register } = get().register;

    return {
      ...register,
      birthDate: birthDate ? format(birthDate, "dd/MM/yyyy") : "",
    };
  },
  updateRegister: (user) => set(({ register }) => ({ register: { ...register, ...user } })),
  reset: () => set({ register: {} }),
}));
