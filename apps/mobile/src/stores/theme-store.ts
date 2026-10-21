import { create } from "zustand";

type Theme = {
  backgroundColor: string,
  foregroundColor: string,
  primaryColor: string,
  secondaryColor: string,
  tertiaryColor: string
}

type ThemeVariant = "light" | "dark" | "system"

export type ThemeState = {
  name: string,
  theme: Theme,
  variant: ThemeVariant
};

type ThemeActions = {
  setTheme: ({ name, theme, variant }: ThemeState) => void,
};

export const useThemeStore = create<ThemeState & ThemeActions>((set) => ({
  name: "default",
  variant: "light",
  theme: {
    "backgroundColor": "",
    foregroundColor: "",
    primaryColor: "",
    secondaryColor: "",
    tertiaryColor: "",
  },
  setTheme: ({ theme, name, variant }) => set(() => ({ name, variant, theme }))
}));

