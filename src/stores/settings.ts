import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "system" | "light" | "dark";

interface SettingsState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "system",
      setTheme: (theme) => set({ theme }),
    }),
    { name: "reposcan-settings" },
  ),
);
