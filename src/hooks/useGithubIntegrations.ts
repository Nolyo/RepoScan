import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { commands, type AppConfig, type RepoInfo, type RepoIntegration } from "../bindings";
import { unwrap } from "../lib/api";

const STALE_MS = 10 * 60_000;

export function useGithubIntegrations(repos: RepoInfo[], config: AppConfig | undefined) {
  const enabled = !!config?.githubIntegrationsEnabled;

  const requests = useMemo(
    () =>
      repos
        .filter((r) => r.kind !== "parentFolder" && !!r.remoteUrl)
        .map((r) => ({
          path: r.path,
          remoteUrl: r.remoteUrl,
          currentBranch: r.currentBranch,
        })),
    [repos],
  );

  const query = useQuery({
    queryKey: ["github-integrations", requests.map((r) => r.path).sort()],
    queryFn: async () => unwrap(await commands.getRepoIntegrations(requests, false)),
    enabled: enabled && requests.length > 0,
    staleTime: STALE_MS,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const byPath = useMemo(() => {
    const map: Record<string, RepoIntegration> = {};
    for (const item of query.data ?? []) {
      map[item.path] = item;
    }
    return map;
  }, [query.data]);

  return { ...query, byPath, enabled };
}

export function useRefreshGithubIntegrations() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      unwrap(await commands.invalidateGithubIntegrations());
      await qc.invalidateQueries({ queryKey: ["github-integrations"] });
    },
  });
}
