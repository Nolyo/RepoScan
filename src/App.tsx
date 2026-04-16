import { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { useSettingsStore } from "./stores/settings";
import OnboardingPage from "./pages/Onboarding";
import MainPage from "./pages/Main";

function AppRouter() {
  const navigate = useNavigate();

  const { data: isFirstRun, isLoading } = useQuery({
    queryKey: ["is_first_run"],
    queryFn: () => invoke<boolean>("is_first_run"),
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!isLoading && isFirstRun !== undefined) {
      navigate(isFirstRun ? "/onboarding" : "/main", { replace: true });
    }
  }, [isFirstRun, isLoading, navigate]);

  if (isLoading) {
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
      <Route path="*" element={<Navigate to="/main" replace />} />
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
