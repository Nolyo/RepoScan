import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "system" | "light" | "dark";
export type Density = "compact" | "comfortable" | "spacious";
export type Accent = "blue" | "green" | "purple" | "orange" | "red";

export interface NotificationPrefs {
  fetchDone: boolean;
  fetchError: boolean;
  updateAvailable: boolean;
  systemNotifications: boolean;
  sound: boolean;
}

interface SettingsState {
  theme: Theme;
  setTheme: (theme: Theme) => void;

  accent: Accent;
  setAccent: (accent: Accent) => void;

  density: Density;
  setDensity: (density: Density) => void;

  animations: boolean;
  setAnimations: (animations: boolean) => void;

  notifications: NotificationPrefs;
  setNotification: (key: keyof NotificationPrefs, value: boolean) => void;

  developerMode: boolean;
  setDeveloperMode: (value: boolean) => void;

  verboseLogs: boolean;
  setVerboseLogs: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "system",
      setTheme: (theme) => set({ theme }),

      accent: "blue",
      setAccent: (accent) => set({ accent }),

      density: "comfortable",
      setDensity: (density) => set({ density }),

      animations: true,
      setAnimations: (animations) => set({ animations }),

      notifications: {
        fetchDone: true,
        fetchError: true,
        updateAvailable: true,
        systemNotifications: false,
        sound: false,
      },
      setNotification: (key, value) =>
        set((s) => ({ notifications: { ...s.notifications, [key]: value } })),

      developerMode: false,
      setDeveloperMode: (developerMode) => set({ developerMode }),

      verboseLogs: false,
      setVerboseLogs: (verboseLogs) => set({ verboseLogs }),
    }),
    { name: "reposcan-settings" },
  ),
);
