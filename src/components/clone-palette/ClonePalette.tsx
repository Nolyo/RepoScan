import { useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import { Search, Star, Loader2, AlertCircle, GitBranch } from "lucide-react";
import { commands, type Editor, type GithubRepoResult } from "../../bindings";
import { unwrap } from "../../lib/api";
import { useConfig, useAvailableEditors } from "../../hooks/useRepos";
import { useCloneProgress, useCloneRepo } from "../../hooks/useCloneRepo";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EDITOR_LABELS: Record<Editor, string> = {
  vsCode: "VS Code",
  vsCodeInsiders: "VS Code Insiders",
  cursor: "Cursor",
  zed: "Zed",
  intelliJ: "IntelliJ IDEA",
  webStorm: "WebStorm",
  pyCharm: "PyCharm",
  rider: "Rider",
  fleet: "Fleet",
  sublime: "Sublime Text",
  neovim: "Neovim",
  vim: "Vim",
  system: "Système",
};

export default function ClonePalette({ open, onOpenChange }: Props) {
  const { data: config } = useConfig();
  const { data: availableEditors = [] } = useAvailableEditors();

  const [rawQuery, setRawQuery] = useState("");
  const [query, setQuery] = useState("");
  const [searchAll, setSearchAll] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [installDeps, setInstallDeps] = useState(true);
  const [openEditor, setOpenEditor] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setSearchAll(config?.githubSearchAll ?? false);
      setRawQuery("");
      setQuery("");
      setActiveIdx(0);
    }
  }, [open, config?.githubSearchAll]);

  useEffect(() => {
    const t = setTimeout(() => setQuery(rawQuery), 250);
    return () => clearTimeout(t);
  }, [rawQuery]);

  const owner = searchAll ? null : config?.defaultGithubOwner?.trim() || null;

  const authStatus = useQuery({
    queryKey: ["gh-auth"],
    queryFn: commands.checkGhAuth,
    enabled: open,
    staleTime: 10_000,
  });

  const search = useQuery({
    queryKey: ["github-search", query, owner, searchAll],
    queryFn: async () => unwrap(await commands.searchGithubRepos(query, owner, 20)),
    enabled: open && query.trim().length > 0 && !!authStatus.data?.loggedIn,
    staleTime: 30_000,
  });

  const results = search.data ?? [];
  useEffect(() => {
    setActiveIdx(0);
  }, [results]);

  const cloneMutation = useCloneRepo(() => {
    onOpenChange(false);
  });

  const { progress, log, reset: resetProgress } = useCloneProgress();
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) resetProgress();
  }, [open, resetProgress]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]);

  const preferredEditor = useMemo<Editor>(() => {
    const pref = config?.preferredEditor ?? "vsCode";
    if (availableEditors.length === 0) return pref;
    return availableEditors.includes(pref) ? pref : availableEditors[0];
  }, [config?.preferredEditor, availableEditors]);

  const onSelect = (repo: GithubRepoResult) => {
    if (!config?.rootPath) return;
    cloneMutation.mutate({
      fullName: repo.fullName,
      destParent: config.rootPath,
      installDeps,
      openEditor,
      editor: preferredEditor,
    });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (cloneMutation.isPending) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[activeIdx]) {
      e.preventDefault();
      onSelect(results[activeIdx]);
    }
  };

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx='${activeIdx}']`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  const ghMissing = authStatus.data?.ghMissing === true;
  const notLoggedIn = authStatus.data && !authStatus.data.loggedIn && !ghMissing;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
        <Dialog.Content
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
          className="fixed left-1/2 top-[20%] -translate-x-1/2 z-50 w-full max-w-xl rounded-xl border bg-background shadow-xl overflow-hidden focus:outline-none"
        >
          <Dialog.Title className="sr-only">Cloner un dépôt distant</Dialog.Title>

          <div className="flex items-center gap-2 px-3 py-2 border-b">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={rawQuery}
              onChange={(e) => setRawQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={
                searchAll
                  ? "Chercher sur tout GitHub…"
                  : `Chercher dans ${owner ?? "…"}`
              }
              className="flex-1 h-8 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
              disabled={cloneMutation.isPending || ghMissing || !!notLoggedIn}
            />
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground select-none whitespace-nowrap">
              <input
                type="checkbox"
                checked={searchAll}
                onChange={(e) => setSearchAll(e.target.checked)}
                className="h-3.5 w-3.5"
                disabled={cloneMutation.isPending}
              />
              tout GitHub
            </label>
          </div>

          {ghMissing && (
            <ErrorBanner>
              La CLI <code className="px-1 rounded bg-muted font-mono">gh</code> n'est pas
              installée. Installe-la puis réessaie (voir{" "}
              <span className="font-mono">github.com/cli/cli</span>).
            </ErrorBanner>
          )}
          {notLoggedIn && (
            <ErrorBanner>
              Pas authentifié sur GitHub. Lance{" "}
              <code className="px-1 rounded bg-muted font-mono">gh auth login</code> dans un
              terminal puis rouvre cette palette.
            </ErrorBanner>
          )}

          <div ref={listRef} className="max-h-[340px] overflow-y-auto">
            {search.isFetching && results.length === 0 && (
              <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Recherche…
              </div>
            )}
            {search.error && (
              <div className="flex items-start gap-2 px-3 py-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                {String(search.error)}
              </div>
            )}
            {!search.isFetching &&
              !search.error &&
              query.trim() &&
              results.length === 0 &&
              authStatus.data?.loggedIn && (
                <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                  Aucun résultat pour « {query} »
                </div>
              )}
            {results.map((repo, idx) => (
              <button
                key={repo.fullName}
                data-idx={idx}
                onMouseEnter={() => setActiveIdx(idx)}
                onClick={() => onSelect(repo)}
                disabled={cloneMutation.isPending}
                className={`w-full flex items-start gap-2 px-3 py-2 text-left text-sm border-b last:border-b-0 ${
                  idx === activeIdx ? "bg-accent" : "hover:bg-accent/50"
                } disabled:opacity-60`}
              >
                <GitBranch className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{repo.fullName}</span>
                    {repo.stars > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground shrink-0">
                        <Star className="h-3 w-3" />
                        {repo.stars}
                      </span>
                    )}
                  </div>
                  {repo.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {repo.description}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 px-3 py-2 border-t bg-muted/40 text-xs">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 select-none">
                <input
                  type="checkbox"
                  checked={installDeps}
                  onChange={(e) => setInstallDeps(e.target.checked)}
                  disabled={cloneMutation.isPending}
                />
                yarn/npm install
              </label>
              <label className="flex items-center gap-1.5 select-none">
                <input
                  type="checkbox"
                  checked={openEditor}
                  onChange={(e) => setOpenEditor(e.target.checked)}
                  disabled={cloneMutation.isPending || availableEditors.length === 0}
                />
                ouvrir dans {EDITOR_LABELS[preferredEditor]}
              </label>
            </div>
            {cloneMutation.isPending ? (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                {progress?.phase === "installing"
                  ? "Installation…"
                  : progress?.phase === "cloning"
                    ? "Clonage…"
                    : "En cours…"}
              </span>
            ) : (
              <span className="text-muted-foreground">
                ↑↓ pour naviguer · ↵ pour cloner
              </span>
            )}
          </div>

          {(cloneMutation.isPending || log.length > 0) && (
            <div
              ref={logRef}
              className="h-32 overflow-y-auto border-t bg-black/90 dark:bg-black/60 px-3 py-2 font-mono text-[11px] leading-relaxed text-zinc-200"
            >
              {log.length === 0 ? (
                <div className="text-zinc-500">En attente de la sortie…</div>
              ) : (
                log.map((line, i) => (
                  <div key={i} className="whitespace-pre-wrap break-words">
                    {line}
                  </div>
                ))
              )}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 py-2 border-b bg-destructive/10 text-destructive text-sm flex items-start gap-2">
      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
      <div className="flex-1">{children}</div>
    </div>
  );
}
