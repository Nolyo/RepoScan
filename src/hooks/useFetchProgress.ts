import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import type { FetchProgress } from "../bindings";

export type FetchProgressMap = Record<string, FetchProgress>;

export function useFetchProgress() {
  const [progress, setProgress] = useState<FetchProgressMap>({});

  useEffect(() => {
    const unlisten = listen<FetchProgress>("fetch_progress", (event) => {
      const p = event.payload;
      setProgress((prev) => ({ ...prev, [p.repoPath]: p }));
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const reset = () => setProgress({});

  return { progress, reset };
}
