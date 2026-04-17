import { useEffect, useState } from "react";
import { AlertTriangle, Copy, ExternalLink, FileText, RotateCcw, Terminal, Trash2, Wrench } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { commands } from "../../../bindings";
import { unwrap } from "../../../lib/api";
import { useSettingsStore } from "../../../stores/settings";
import { useRefreshGithubIntegrations } from "../../../hooks/useGithubIntegrations";
import { Row, SectionHero, Switch } from "../widgets";

export default function AdvancedSection() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const refreshGithub = useRefreshGithubIntegrations();
  const { developerMode, setDeveloperMode, verboseLogs, setVerboseLogs } =
    useSettingsStore();
  const [configPath, setConfigPath] = useState<string>("");
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    commands.getConfigPath().then(setConfigPath).catch(() => {});
  }, []);

  const copyConfigPath = async () => {
    try {
      unwrap(await commands.copyPath(configPath));
      toast.success(t("contextMenu.pathCopied"));
    } catch (e) {
      toast.error(String(e));
    }
  };

  const openConfig = () => {
    commands.openInExplorer(configPath).catch((e) => toast.error(String(e)));
  };

  const doReset = async () => {
    try {
      await commands.resetConfig();
      await qc.invalidateQueries({ queryKey: ["config"] });
      toast.success(t("settings.advanced.resetDone"));
      setConfirmReset(false);
    } catch (e) {
      toast.error(String(e));
    }
  };

  return (
    <section id="rs-sect-advanced" className="rs-section">
      <SectionHero
        eyebrow={
          <>
            <Wrench size={13} />
            {t("settings.nav.advanced")}
          </>
        }
        title={t("settings.advanced.heroTitle")}
        description={t("settings.advanced.heroDesc")}
        eyebrowColor="danger"
        illustration={
          <div className="absolute inset-0 flex items-center justify-center">
            <Terminal size={48} style={{ color: "hsl(var(--rs-muted-fg))" }} />
          </div>
        }
      />

      <div className="rs-card">
        <Row
          title={t("settings.advanced.configFile")}
          description={
            <span className="font-mono">{configPath || "…"}</span>
          }
        >
          <div className="flex gap-2">
            <button
              className="rs-btn"
              onClick={copyConfigPath}
              disabled={!configPath}
            >
              <Copy size={13} />
              {t("settings.advanced.copy")}
            </button>
            <button
              className="rs-btn"
              onClick={openConfig}
              disabled={!configPath}
            >
              <ExternalLink size={13} />
              {t("settings.advanced.open")}
            </button>
          </div>
        </Row>

        <Row
          title={t("settings.advanced.githubCache")}
          description={t("settings.advanced.githubCacheDesc")}
        >
          <button
            className="rs-btn"
            disabled={refreshGithub.isPending}
            onClick={() => {
              refreshGithub.mutate(undefined, {
                onSuccess: () => toast.success(t("settings.github.cacheCleared")),
              });
            }}
          >
            <Trash2 size={13} />
            {t("settings.advanced.clearCache")}
          </button>
        </Row>

        <Row
          title={t("settings.advanced.logs")}
          description={t("settings.advanced.logsDesc")}
        >
          <div className="flex gap-2 items-center">
            <Switch checked={verboseLogs} onChange={setVerboseLogs} />
            <button
              className="rs-btn"
              onClick={() => toast.info(t("settings.advanced.logsSoon"))}
            >
              <FileText size={13} />
              {t("settings.advanced.viewLogs")}
            </button>
          </div>
        </Row>

        <Row
          title={t("settings.advanced.devMode")}
          description={t("settings.advanced.devModeDesc")}
        >
          <Switch checked={developerMode} onChange={setDeveloperMode} />
        </Row>
      </div>

      {/* Danger zone */}
      <div
        className="rs-card mt-6"
        style={{ borderColor: "hsl(var(--rs-danger) / .3)" }}
      >
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle
              size={14}
              style={{ color: "hsl(var(--rs-danger))" }}
            />
            <div
              className="text-[12.5px] font-semibold uppercase tracking-[.08em]"
              style={{ color: "hsl(var(--rs-danger))" }}
            >
              {t("settings.advanced.dangerZone")}
            </div>
          </div>
          <div className="flex items-center justify-between gap-6">
            <div>
              <div className="text-[13.5px] font-semibold">
                {t("settings.advanced.reset")}
              </div>
              <div
                className="text-[12.5px] mt-0.5"
                style={{ color: "hsl(var(--rs-muted-fg))" }}
              >
                {t("settings.advanced.resetDesc")}
              </div>
            </div>
            {confirmReset ? (
              <div className="flex gap-2">
                <button className="rs-btn" onClick={() => setConfirmReset(false)}>
                  {t("settings.advanced.cancel")}
                </button>
                <button className="rs-btn rs-btn-danger" onClick={doReset}>
                  <RotateCcw size={13} />
                  {t("settings.advanced.confirm")}
                </button>
              </div>
            ) : (
              <button
                className="rs-btn rs-btn-danger"
                onClick={() => setConfirmReset(true)}
              >
                <RotateCcw size={13} />
                {t("settings.advanced.reset")}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
