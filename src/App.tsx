import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { useSettingsStore } from "./stores/settings";
import OnboardingPage from "./pages/Onboarding";
import MainPage from "./pages/Main";

function AppRouter() {
  // Always refetch on mount to avoid relying on a stale cache when the
  // config file gets deleted/recreated outside the app.
  const { data: isFirstRun, isLoading } = useQuery({
    queryKey: ["is_first_run"],
    queryFn: () => invoke<boolean>("is_first_run"),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
  });

  if (isLoading || isFirstRun === undefined) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Chargement…</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/main" element={<MainPage />} />
      <Route
        path="*"
        element={<Navigate to={isFirstRun ? "/onboarding" : "/main"} replace />}
      />
    </Routes>
  );
}

export default function App() {
  const { theme } = useSettingsStore();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    if (theme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.add(prefersDark ? "dark" : "light");
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  return <AppRouter />;
}
