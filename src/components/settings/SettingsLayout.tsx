import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Bell,
  Check,
  Command,
  DownloadCloud,
  FolderGit2,
  Info,
  Palette,
  ScanSearch,
  SlidersHorizontal,
  Wrench,
  LoaderCircle,
  LifeBuoy,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import { useSettingsStore } from "../../stores/settings";
import { useAppVersion } from "../../hooks/useUpdater";
import { GithubMark } from "./widgets";
import type { SaveState } from "./useAutoSaveConfig";
import "./settings.css";

export interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
  badge?: ReactNode;
}

export function SettingsLayout({
  children,
  saveState,
  sectionTitle,
  setActiveId,
  activeId,
  navGroups,
}: {
  children: ReactNode;
  saveState: SaveState;
  sectionTitle: string;
  activeId: string;
  setActiveId: (id: string) => void;
  navGroups: { label: string; items: NavItem[] }[];
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme, accent } = useSettingsStore();
  const { data: appVersion } = useAppVersion();
  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollingToRef = useRef<number>(0);

  const resolvedTheme = useMemo(() => {
    if (theme !== "system") return theme;
    return typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }, [theme]);

  const onNavClick = useCallback(
    (id: string) => {
      const el = document.getElementById(`rs-sect-${id}`);
      const container = contentRef.current;
      if (!el || !container) return;
      scrollingToRef.current = Date.now();
      container.scrollTo({ top: el.offsetTop - 16, behavior: "smooth" });
      setActiveId(id);
    },
    [setActiveId],
  );

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;
    const sections = navGroups
      .flatMap((g) => g.items)
      .map((it) => document.getElementById(`rs-sect-${it.id}`))
      .filter((el): el is HTMLElement => el !== null);

    const io = new IntersectionObserver(
      (entries) => {
        if (Date.now() - scrollingToRef.current < 600) return;
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const id = e.target.id.replace(/^rs-sect-/, "");
            setActiveId(id);
          }
        });
      },
      { root: container, rootMargin: "-10% 0px -70% 0px", threshold: 0 },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [navGroups, setActiveId]);

  const indicator = renderSaveIndicator(saveState, t);

  return (
    <div
      ref={rootRef}
      className="rs-settings flex h-screen w-screen flex-col overflow-hidden"
      data-theme={resolvedTheme}
      data-accent={accent}
      style={{
        background: "hsl(var(--rs-bg))",
        color: "hsl(var(--rs-fg))",
        fontFamily: "Inter, ui-sans-serif, system-ui",
      }}
    >
      {/* Breadcrumb header */}
      <div
        className="flex items-center justify-between px-6 h-14 border-b shrink-0"
        style={{ borderColor: "hsl(var(--rs-border))" }}
      >
        <div className="flex items-center gap-2 text-[13px]">
          <button
            type="button"
            className="rs-btn rs-btn-ghost"
            onClick={() => navigate("/main")}
            title={t("settings.back")}
          >
            <ArrowLeft size={14} />
            <span>{t("settings.back")}</span>
          </button>
          <span style={{ color: "hsl(var(--rs-muted-fg))" }}>/</span>
          <span style={{ color: "hsl(var(--rs-muted-fg))" }}>{t("settings.title")}</span>
          <span style={{ color: "hsl(var(--rs-muted-fg))" }}>/</span>
          <span className="font-medium">{sectionTitle}</span>
        </div>
        <div className="flex items-center gap-3">{indicator}</div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside
          className="w-[248px] shrink-0 border-r py-4 px-3 overflow-y-auto"
          style={{
            borderColor: "hsl(var(--rs-border))",
            background: "hsl(var(--rs-card))",
          }}
        >
          <div className="px-2 pb-3 flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, hsl(var(--rs-accent)), hsl(210 100% 40%))",
              }}
            >
              <FolderGit2 size={16} className="text-white" />
            </div>
            <div>
              <div className="text-[13px] font-semibold">RepoScan</div>
              <div
                className="text-[11px]"
                style={{ color: "hsl(var(--rs-muted-fg))" }}
              >
                v{appVersion ?? "…"}
              </div>
            </div>
          </div>

          {navGroups.map((group) => (
            <div key={group.label}>
              <div className="rs-nav-group">{group.label}</div>
              <nav className="flex flex-col gap-0.5 mb-2">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="rs-nav-item"
                    data-active={activeId === item.id}
                    onClick={() => onNavClick(item.id)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.badge}
                  </button>
                ))}
              </nav>
            </div>
          ))}

          <div className="mt-4 px-2">
            <div
              className="rs-card p-3"
              style={{ background: "hsl(var(--rs-card))" }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <LifeBuoy
                  size={14}
                  style={{ color: "hsl(var(--rs-muted-fg))" }}
                />
                <div className="text-[12px] font-medium">
                  {t("settings.help.title")}
                </div>
              </div>
              <p
                className="text-[11.5px] leading-relaxed"
                style={{ color: "hsl(var(--rs-muted-fg))" }}
              >
                {t("settings.help.body")}
              </p>
              <div className="flex gap-1 mt-2">
                <a
                  href="https://github.com/nolyo/reposcan#readme"
                  target="_blank"
                  rel="noreferrer"
                  className="rs-btn rs-btn-ghost !h-7 !px-2 text-[11px]"
                >
                  <BookOpen size={12} />
                  {t("settings.help.docs")}
                </a>
                <a
                  href="https://github.com/nolyo/reposcan/issues"
                  target="_blank"
                  rel="noreferrer"
                  className="rs-btn rs-btn-ghost !h-7 !px-2 text-[11px]"
                >
                  <ExternalLink size={12} />
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main ref={contentRef} className="flex-1 overflow-y-auto">
          <div className="max-w-[920px] mx-auto px-10 py-8 space-y-14">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function renderSaveIndicator(
  state: SaveState,
  t: (key: string) => string,
): ReactNode {
  if (state === "saving") {
    return (
      <div
        className="flex items-center gap-1.5 text-[12px]"
        style={{ color: "hsl(var(--rs-muted-fg))" }}
      >
        <LoaderCircle size={12} className="animate-spin" />
        <span>{t("settings.saving")}</span>
      </div>
    );
  }
  if (state === "saved") {
    return (
      <div
        key="saved"
        className="rs-saved-flash flex items-center gap-1.5 text-[12px]"
        style={{ color: "hsl(var(--rs-success))" }}
      >
        <Check size={12} strokeWidth={3} />
        <span>{t("settings.savedShort")}</span>
      </div>
    );
  }
  if (state === "error") {
    return (
      <div
        className="flex items-center gap-1.5 text-[12px]"
        style={{ color: "hsl(var(--rs-danger))" }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: "hsl(var(--rs-danger))" }}
        />
        <span>{t("settings.saveError")}</span>
      </div>
    );
  }
  return (
    <div
      className="flex items-center gap-1.5 text-[12px]"
      style={{ color: "hsl(var(--rs-muted-fg))" }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: "hsl(var(--rs-success))" }}
      />
      <span>{t("settings.savedAll")}</span>
    </div>
  );
}

export const settingsIcons = {
  general: <SlidersHorizontal size={16} />,
  scan: <ScanSearch size={16} />,
  github: <GithubMark size={16} />,
  appearance: <Palette size={16} />,
  notifications: <Bell size={16} />,
  shortcuts: <Command size={16} />,
  updates: <DownloadCloud size={16} />,
  advanced: <Wrench size={16} />,
  about: <Info size={16} />,
};
