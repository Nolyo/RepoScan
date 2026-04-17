import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { RefreshCw, Download, Settings, Moon, Sun, Monitor, Plus } from "lucide-react";
import { commands } from "../bindings";
import { unwrap } from "../lib/api";
import { useConfig, useRepos, useAvailableEditors, useInvalidateRepos } from "../hooks/useRepos";
import { useUiStore } from "../stores/ui";
import { useSettingsStore } from "../stores/settings";
import { useFetchProgress } from "../hooks/useFetchProgress";
import RepoTable from "../components/repo-table/RepoTable";
import SearchBar from "../components/toolbar/SearchBar";
import FilterBar from "../components/toolbar/FilterBar";
import FetchSheet from "../components/toolbar/FetchSheet";
import SettingsDialog from "../components/settings/SettingsDialog";
import ClonePalette from "../components/clone-palette/ClonePalette";
import { flattenRepos } from "../lib/repoUtils";

export default function MainPage() {
  const { data: config, isLoading: configLoading } = useConfig();
  const { data: repos = [], isLoading, refetch } = useRepos(config);
  const { data: editors = [] } = useAvailableEditors();
  const { searchQuery, filters, setFetchSheetOpen } = useUiStore();
  const { theme, setTheme } = useSettingsStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cloneOpen, setCloneOpen] = useState(false);
  const { progress, reset: resetProgress } = useFetchProgress();
  const invalidateRepos = useInvalidateRepos();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCloneOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const allGitRepos = flattenRepos(repos).filter((r) => r.kind !== "parentFolder");

  const fetchAllMutation = useMutation({
    mutationFn: async () => {
      resetProgress();
      setFetchSheetOpen(true);
      return unwrap(await commands.fetchAll(allGitRepos.map((r) => r.path)));
    },
    onSuccess: (results) => {
      const failed = results.filter((r) => !r.success).length;
      if (failed > 0) {
        toast.error(`Fetch terminé avec ${failed} erreur(s)`);
      } else {
        toast.success(`${results.length} dépôts mis à jour`);
      }
      invalidateRepos();
    },
    onError: (e) => toast.error(String(e)),
  });

  if (!configLoading && !config?.rootPath) {
    return <Navigate to="/onboarding" replace />;
  }

  const themeIcon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
  const ThemeIcon = themeIcon;
  const cycleTheme = () => {
    const next = theme === "system" ? "light" : theme === "light" ? "dark" : "system";
    setTheme(next);
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 h-12 border-b shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">RepoScan</span>
          {config?.rootPath && (
            <span className="text-xs text-muted-foreground font-mono truncate max-w-[300px]">
              {config.rootPath}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCloneOpen(true)}
            title="Cloner un dépôt distant (Ctrl+K)"
            className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={() => refetch()}
            title="Rafraîchir"
            className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => fetchAllMutation.mutate()}
            disabled={fetchAllMutation.isPending || allGitRepos.length === 0}
            title={`Fetch all (${allGitRepos.length} repos)`}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Download className="h-3.5 w-3.5" />
            Fetch all
            {allGitRepos.length > 0 && (
              <span className="ml-0.5 text-primary-foreground/70">({allGitRepos.length})</span>
            )}
          </button>
          <button
            onClick={cycleTheme}
            title="Changer le thème"
            className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground"
          >
            <ThemeIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            title="Paramètres"
            className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b shrink-0">
        <SearchBar />
        <FilterBar />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            Scan en cours…
          </div>
        ) : repos.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <p className="text-sm">Aucun dépôt trouvé dans ce dossier.</p>
            <p className="text-xs">
              Vérifiez le chemin dans{" "}
              <button
                onClick={() => setSettingsOpen(true)}
                className="underline hover:text-foreground"
              >
                les paramètres
              </button>
              .
            </p>
          </div>
        ) : (
          <RepoTable repos={repos} editors={editors} />
        )}
      </div>

      {/* Status bar */}
      <footer className="px-4 h-6 border-t flex items-center text-xs text-muted-foreground shrink-0">
        {allGitRepos.length} dépôts
        {(searchQuery || Object.values(filters).some(Boolean)) && (
          <span className="ml-1 text-primary">— filtrés</span>
        )}
      </footer>

      <FetchSheet progress={progress} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <ClonePalette open={cloneOpen} onOpenChange={setCloneOpen} />
    </div>
  );
}
