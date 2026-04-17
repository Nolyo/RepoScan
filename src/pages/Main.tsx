import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { RefreshCw, Download, Settings, Moon, Sun, Monitor, Plus, Github } from "lucide-react";
import { useTranslation } from "react-i18next";
import { commands } from "../bindings";
import { unwrap } from "../lib/api";
import { useConfig, useRepos, useAvailableEditors, useInvalidateRepos } from "../hooks/useRepos";
import { useUiStore } from "../stores/ui";
import { useSettingsStore } from "../stores/settings";
import { useFetchProgress } from "../hooks/useFetchProgress";
import { useStartupUpdateCheck } from "../hooks/useUpdater";
import {
  useGithubIntegrations,
  useRefreshGithubIntegrations,
} from "../hooks/useGithubIntegrations";
import RepoTable from "../components/repo-table/RepoTable";
import SearchBar from "../components/toolbar/SearchBar";
import FilterBar from "../components/toolbar/FilterBar";
import FetchSheet from "../components/toolbar/FetchSheet";
import ClonePalette from "../components/clone-palette/ClonePalette";
import { flattenRepos } from "../lib/repoUtils";
import i18n from "../i18n";

export default function MainPage() {
  const { data: config, isLoading: configLoading } = useConfig();
  const { data: repos = [], isLoading, refetch } = useRepos(config);
  const { data: editors = [] } = useAvailableEditors();
  const { searchQuery, filters, setFetchSheetOpen } = useUiStore();
  const { theme, setTheme } = useSettingsStore();
  const [cloneOpen, setCloneOpen] = useState(false);
  const navigate = useNavigate();
  const { progress, reset: resetProgress } = useFetchProgress();
  const invalidateRepos = useInvalidateRepos();
  const { t } = useTranslation();
  useStartupUpdateCheck();

  useEffect(() => {
    if (config?.language) {
      const lang =
        config.language === "fr" ? "fr" : config.language === "en" ? "en" : null;
      if (lang && i18n.language !== lang) {
        i18n.changeLanguage(lang);
      } else if (config.language === "system") {
        const sysLang = navigator.language.startsWith("fr") ? "fr" : "en";
        if (i18n.language !== sysLang) i18n.changeLanguage(sysLang);
      }
    }
  }, [config?.language]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCloneOpen(true);
      } else if ((e.metaKey || e.ctrlKey) && e.key === ",") {
        e.preventDefault();
        navigate("/settings");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  const allGitRepos = flattenRepos(repos).filter((r) => r.kind !== "parentFolder");

  const {
    byPath: integrationsByPath,
    isFetching: integrationsLoading,
    enabled: githubEnabled,
  } = useGithubIntegrations(allGitRepos, config);
  const refreshGithub = useRefreshGithubIntegrations();

  const fetchAllMutation = useMutation({
    mutationFn: async () => {
      resetProgress();
      setFetchSheetOpen(true);
      return unwrap(await commands.fetchAll(allGitRepos.map((r) => r.path)));
    },
    onSuccess: (results) => {
      const failed = results.filter((r) => !r.success).length;
      if (failed > 0) {
        toast.error(i18n.t("fetch.failedCount", { count: failed }));
      } else {
        toast.success(i18n.t("fetch.allUpdated", { count: results.length }));
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
            title={t("clone.title") + " (Ctrl+K)"}
            className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={() => refetch()}
            title={t("header.refreshTitle")}
            className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => fetchAllMutation.mutate()}
            disabled={fetchAllMutation.isPending || allGitRepos.length === 0}
            title={`${t("header.fetchAll")} (${allGitRepos.length} repos)`}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Download className="h-3.5 w-3.5" />
            {t("header.fetchAll")}
            {allGitRepos.length > 0 && (
              <span className="ml-0.5 text-primary-foreground/70">({allGitRepos.length})</span>
            )}
          </button>
          {githubEnabled && (
            <button
              onClick={() => refreshGithub.mutate()}
              disabled={refreshGithub.isPending || integrationsLoading}
              title={t("header.refreshGithub")}
              className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground disabled:opacity-50"
            >
              <Github
                className={`h-4 w-4 ${
                  refreshGithub.isPending || integrationsLoading ? "animate-pulse" : ""
                }`}
              />
            </button>
          )}
          <button
            onClick={cycleTheme}
            title={t("header.changeTheme")}
            className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground"
          >
            <ThemeIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => navigate("/settings")}
            title={t("settings.title")}
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
            {t("app.scanning")}
          </div>
        ) : repos.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <p className="text-sm">{t("app.noRepos")}</p>
            <p className="text-xs">
              {t("app.noReposHint")}{" "}
              <button
                onClick={() => navigate("/settings")}
                className="underline hover:text-foreground"
              >
                {t("app.noReposSettings")}
              </button>
              .
            </p>
          </div>
        ) : (
          <RepoTable
            repos={repos}
            editors={editors}
            githubEnabled={githubEnabled}
            integrationsByPath={integrationsByPath}
            integrationsLoading={integrationsLoading}
          />
        )}
      </div>

      {/* Status bar */}
      <footer className="px-4 h-6 border-t flex items-center text-xs text-muted-foreground shrink-0">
        {allGitRepos.length} {t("app.repos")}
        {(searchQuery || Object.values(filters).some(Boolean)) && (
          <span className="ml-1 text-primary">{t("app.filtered")}</span>
        )}
      </footer>

      <FetchSheet progress={progress} />
      <ClonePalette open={cloneOpen} onOpenChange={setCloneOpen} />
    </div>
  );
}
