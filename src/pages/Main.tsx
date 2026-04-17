import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowDownToLine,
  Clock,
  FolderGit2,
  Github,
  Home,
  Monitor,
  Moon,
  Pencil,
  Plus,
  RefreshCw,
  Settings,
  Sun,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { commands } from "../bindings";
import { unwrap } from "../lib/api";
import { useConfig, useRepos, useAvailableEditors, useInvalidateRepos } from "../hooks/useRepos";
import { useAppVersion } from "../hooks/useUpdater";
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
import "./main.css";

function splitRootPath(path: string): string[] {
  if (!path) return [];
  return path.split(/[\\/]/).filter(Boolean);
}

function useRelativeTime(timestamp: number | null | undefined) {
  const [, force] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => force((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);
  const { t } = useTranslation();
  if (!timestamp) return t("footer.noScan");
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 10) return t("footer.lastScanJustNow");
  if (diffSec < 60) return t("footer.lastScanSec", { s: diffSec });
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return t("footer.lastScanMin", { m: diffMin });
  const diffH = Math.floor(diffMin / 60);
  return t("footer.lastScanHour", { h: diffH });
}

export default function MainPage() {
  const { data: config, isLoading: configLoading } = useConfig();
  const reposQuery = useRepos(config);
  const { data: repos = [], isLoading, refetch, dataUpdatedAt } = reposQuery;
  const { data: editors = [] } = useAvailableEditors();
  const { data: appVersion } = useAppVersion();
  const { searchQuery, filters, setFetchSheetOpen } = useUiStore();
  const { theme, accent, density, animations, setTheme } = useSettingsStore();
  const [cloneOpen, setCloneOpen] = useState(false);
  const navigate = useNavigate();
  const { progress, reset: resetProgress } = useFetchProgress();
  const invalidateRepos = useInvalidateRepos();
  const { t } = useTranslation();
  useStartupUpdateCheck();

  const resolvedTheme = useMemo(() => {
    if (theme !== "system") return theme;
    return typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }, [theme]);

  const lastScanLabel = useRelativeTime(dataUpdatedAt);

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

  const allGitRepos = useMemo(
    () => flattenRepos(repos).filter((r) => r.kind !== "parentFolder"),
    [repos],
  );

  const filterCounts = useMemo(() => {
    let dirty = 0;
    let ahead = 0;
    let behind = 0;
    let noUpstream = 0;
    for (const r of allGitRepos) {
      if (!r.status.clean) dirty++;
      const ab = r.aheadBehind;
      if (ab) {
        if (ab.hasUpstream && ab.ahead > 0) ahead++;
        if (ab.hasUpstream && ab.behind > 0) behind++;
        if (!ab.hasUpstream) noUpstream++;
      }
    }
    return { dirty, ahead, behind, noUpstream };
  }, [allGitRepos]);

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

  const ThemeIcon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
  const cycleTheme = () => {
    const next = theme === "system" ? "light" : theme === "light" ? "dark" : "system";
    setTheme(next);
  };

  const rootSegments = splitRootPath(config?.rootPath ?? "");

  return (
    <div
      className="rs-app flex h-screen w-screen flex-col overflow-hidden"
      data-theme={resolvedTheme}
      data-accent={accent}
      data-density={density}
      data-animations={animations ? "true" : "false"}
      style={{ fontFamily: "Inter, ui-sans-serif, system-ui" }}
    >
      {/* Title bar */}
      <div className="rs-titlebar">
        <div className="rs-tl-center">
          <span className="rs-tl-logo">
            <FolderGit2 size={10} className="text-white" />
          </span>
          <span className="rs-tl-name">RepoScan</span>
          {config?.rootPath && (
            <>
              <span>—</span>
              <span className="rs-tl-path">{config.rootPath}</span>
            </>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="rs-toolbar">
        {rootSegments.length > 0 && (
          <div className="rs-breadcrumb min-w-0">
            <span className="rs-bc-seg">
              <Home size={11} />
            </span>
            {rootSegments.map((seg, i) => (
              <span key={`${seg}-${i}`} className="inline-flex items-center">
                <span className="rs-bc-sep">/</span>
                <span
                  className={`rs-bc-seg ${i === rootSegments.length - 1 ? "last" : ""}`}
                >
                  {seg}
                </span>
              </span>
            ))}
          </div>
        )}

        <SearchBar />

        <FilterBar counts={filterCounts} />

        <div className="flex-1" />

        <div className="flex items-center gap-1.5">
          <button
            className="rs-ibtn"
            title={t("clone.title") + " (Ctrl+K)"}
            onClick={() => setCloneOpen(true)}
          >
            <Plus size={15} />
          </button>
          <button
            className="rs-ibtn"
            title={t("header.refreshTitle") + " (Ctrl+R)"}
            onClick={() => refetch()}
          >
            <RefreshCw size={15} className={isLoading ? "animate-spin" : undefined} />
          </button>
          <button
            className="rs-pbtn"
            onClick={() => fetchAllMutation.mutate()}
            disabled={fetchAllMutation.isPending || allGitRepos.length === 0}
            title={`${t("header.fetchAll")} (${allGitRepos.length})`}
          >
            <ArrowDownToLine size={14} />
            {t("header.fetchAll")}
            {allGitRepos.length > 0 && (
              <span
                className="rs-mono"
                style={{ opacity: .75, fontSize: "11px", fontWeight: 500 }}
              >
                ({allGitRepos.length})
              </span>
            )}
          </button>
          {githubEnabled && (
            <button
              className="rs-ibtn"
              onClick={() => refreshGithub.mutate()}
              disabled={refreshGithub.isPending || integrationsLoading}
              title={t("header.refreshGithub")}
            >
              <Github
                size={15}
                className={
                  refreshGithub.isPending || integrationsLoading
                    ? "animate-pulse"
                    : undefined
                }
              />
            </button>
          )}
          <div className="rs-tb-sep" />
          <button className="rs-ibtn" onClick={cycleTheme} title={t("header.changeTheme")}>
            <ThemeIcon size={15} />
          </button>
          <button
            className="rs-ibtn"
            onClick={() => navigate("/settings")}
            title={t("settings.title") + " (Ctrl+,)"}
          >
            <Settings size={15} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden flex">
        {isLoading ? (
          <div className="flex h-full w-full items-center justify-center rs-muted text-sm">
            {t("app.scanning")}
          </div>
        ) : repos.length === 0 ? (
          <div className="rs-empty w-full">
            <div className="rs-empty-icon">
              <Pencil size={20} className="rs-muted" />
            </div>
            <div className="text-[13px] font-semibold" style={{ color: "hsl(var(--rs-fg))" }}>
              {t("app.noRepos")}
            </div>
            <div className="text-[12px] rs-muted mt-1">
              {t("app.noReposHint")}{" "}
              <button
                onClick={() => navigate("/settings")}
                className="underline"
                style={{ color: "hsl(var(--rs-accent))" }}
              >
                {t("app.noReposSettings")}
              </button>
              .
            </div>
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

      {/* Footer */}
      <div className="rs-footer">
        <div className="flex items-center gap-1.5">
          <span className="rs-footer-dot" />
          <span>
            {allGitRepos.length} {t("app.repos")}
          </span>
          {(searchQuery || Object.values(filters).some(Boolean)) && (
            <span style={{ color: "hsl(var(--rs-accent))" }}>{t("app.filtered")}</span>
          )}
        </div>
        {config?.rootPath && (
          <>
            <div className="rs-footer-sep" />
            <div className="flex items-center gap-1.5 rs-muted">
              <FolderGit2 size={11} />
              <span className="rs-mono truncate max-w-[360px]">{config.rootPath}</span>
            </div>
          </>
        )}
        <div className="flex-1" />
        <div className="flex items-center gap-1.5">
          <Clock size={11} />
          <span>{lastScanLabel}</span>
        </div>
        <div className="rs-footer-sep" />
        <span className="rs-mono">v{appVersion ?? "—"}</span>
      </div>

      <FetchSheet progress={progress} />
      <ClonePalette open={cloneOpen} onOpenChange={setCloneOpen} />
    </div>
  );
}
