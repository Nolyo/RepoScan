import { useState } from "react";
import { Download, DownloadCloud, FlaskConical, RefreshCw, ShieldCheck, Rocket, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { commands, type AppConfig, type UpdateChannel } from "../../../bindings";
import { useAppVersion, runUpdateCheck } from "../../../hooks/useUpdater";
import i18n from "../../../i18n";
import { unwrap } from "../../../lib/api";
import { Row, SectionHero, SegmentedControl, Switch } from "../widgets";
import { useSettingsStore } from "../../../stores/settings";

export default function UpdatesSection({
  form,
  update,
}: {
  form: AppConfig;
  update: (patch: Partial<AppConfig>) => void;
}) {
  const { t } = useTranslation();
  const { data: appVersion } = useAppVersion();
  const [checking, setChecking] = useState(false);
  const [installing, setInstalling] = useState(false);
  const { notifications, setNotification } = useSettingsStore();

  const { data: availableUpdate } = useQuery({
    queryKey: ["pending-update", form.updateChannel],
    queryFn: async () => {
      const res = await commands.checkForUpdate();
      if (res.status === "error") return null;
      return res.data;
    },
    staleTime: 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const channelOptions = [
    {
      value: "stable" as UpdateChannel,
      label: t("settings.updates.stable"),
      icon: <ShieldCheck size={13} />,
    },
    {
      value: "beta" as UpdateChannel,
      label: t("settings.updates.beta"),
      icon: <FlaskConical size={13} />,
    },
  ];

  const installNow = async () => {
    setInstalling(true);
    try {
      unwrap(await commands.installUpdate());
    } catch (e) {
      toast.error(i18n.t("updater.installFailed", { error: String(e) }));
    } finally {
      setInstalling(false);
    }
  };

  return (
    <section id="rs-sect-updates" className="rs-section">
      <SectionHero
        eyebrow={
          <>
            <DownloadCloud size={13} />
            {t("settings.nav.updates")}
          </>
        }
        title={t("settings.updates.heroTitle")}
        description={t("settings.updates.heroDesc")}
        illustration={
          <>
            <div
              className="rs-ill-blob"
              style={{
                width: 100,
                height: 100,
                background: "hsl(var(--rs-accent))",
                top: 20,
                right: 10,
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Rocket size={48} style={{ color: "hsl(var(--rs-accent))" }} />
            </div>
          </>
        }
      />

      {availableUpdate && (
        <div
          className="rs-card mb-4 p-4 flex items-center gap-3"
          style={{
            background: "hsl(var(--rs-accent) / .08)",
            borderColor: "hsl(var(--rs-accent) / .35)",
          }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{
              background: "hsl(var(--rs-accent) / .18)",
              color: "hsl(var(--rs-accent))",
            }}
          >
            <Sparkles size={16} />
          </div>
          <div className="flex-1">
            <div className="text-[13.5px] font-semibold">
              {t("settings.updates.available")} :{" "}
              <span className="font-mono">{availableUpdate.version}</span>
            </div>
            <div
              className="text-[12px] line-clamp-2"
              style={{ color: "hsl(var(--rs-muted-fg))" }}
            >
              {availableUpdate.body?.slice(0, 200) ??
                t("settings.updates.noReleaseNotes")}
            </div>
          </div>
          <button
            className="rs-btn rs-btn-primary"
            onClick={installNow}
            disabled={installing}
          >
            <Download size={13} />
            {installing
              ? t("settings.updates.installing")
              : t("settings.updates.installRestart")}
          </button>
        </div>
      )}

      <div className="rs-card">
        <Row
          title={t("settings.updates.channel")}
          description={t("settings.updates.channelDesc")}
        >
          <SegmentedControl<UpdateChannel>
            options={channelOptions}
            value={(form.updateChannel ?? "stable") as UpdateChannel}
            onChange={(v) => update({ updateChannel: v })}
          />
        </Row>

        <Row
          title={t("settings.updates.checkOnStartup")}
          description={t("settings.updates.checkOnStartupDesc")}
        >
          <Switch
            checked={notifications.updateAvailable}
            onChange={(v) => setNotification("updateAvailable", v)}
          />
        </Row>

        <Row
          title={t("settings.updates.installedVersion")}
          description={
            <span className="font-mono">
              {appVersion ?? "…"}
            </span>
          }
        >
          <button
            className="rs-btn"
            disabled={checking}
            onClick={async () => {
              setChecking(true);
              try {
                await runUpdateCheck({ silent: false });
              } finally {
                setChecking(false);
              }
            }}
          >
            <RefreshCw size={13} className={checking ? "animate-spin" : ""} />
            {t("settings.updates.checkNow")}
          </button>
        </Row>
      </div>
    </section>
  );
}
