import { useQuery, useQueryClient } from "@tanstack/react-query";
import { commands, type AppConfig } from "../bindings";

export function useRepos(config: AppConfig | undefined) {
  return useQuery({
    queryKey: ["repos", config?.rootPath, config?.maxScanDepth, config?.showEmptyFolders],
    queryFn: () =>
      commands.scanRepositories(
        config!.rootPath,
        config!.maxScanDepth,
        config!.showEmptyFolders,
      ),
    enabled: !!config?.rootPath,
    staleTime: 60_000,
  });
}

export function useConfig() {
  return useQuery({
    queryKey: ["config"],
    queryFn: commands.loadConfig,
    staleTime: Infinity,
  });
}

export function usePlatformInfo() {
  return useQuery({
    queryKey: ["platform"],
    queryFn: commands.platformInfo,
    staleTime: Infinity,
  });
}

export function useAvailableEditors() {
  return useQuery({
    queryKey: ["editors"],
    queryFn: commands.detectAvailableEditors,
    staleTime: Infinity,
  });
}

export function useInvalidateRepos() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["repos"] });
}
