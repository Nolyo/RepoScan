import { Bell, BellRing } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSettingsStore, type NotificationPrefs } from "../../../stores/settings";
import { Row, SectionHero, Switch } from "../widgets";

export default function NotificationsSection() {
  const { t } = useTranslation();
  const { notifications, setNotification } = useSettingsStore();

  const rows: { key: keyof NotificationPrefs; title: string; desc: string }[] = [
    {
      key: "fetchDone",
      title: t("settings.notifications.fetchDone"),
      desc: t("settings.notifications.fetchDoneDesc"),
    },
    {
      key: "fetchError",
      title: t("settings.notifications.fetchError"),
      desc: t("settings.notifications.fetchErrorDesc"),
    },
    {
      key: "updateAvailable",
      title: t("settings.notifications.updateAvailable"),
      desc: t("settings.notifications.updateAvailableDesc"),
    },
    {
      key: "systemNotifications",
      title: t("settings.notifications.system"),
      desc: t("settings.notifications.systemDesc"),
    },
    {
      key: "sound",
      title: t("settings.notifications.sound"),
      desc: t("settings.notifications.soundDesc"),
    },
  ];

  return (
    <section id="rs-sect-notifications" className="rs-section">
      <SectionHero
        eyebrow={
          <>
            <Bell size={13} />
            {t("settings.nav.notifications")}
          </>
        }
        title={t("settings.notifications.heroTitle")}
        description={t("settings.notifications.heroDesc")}
        illustration={
          <>
            <div
              className="rs-ill-blob"
              style={{
                width: 100,
                height: 100,
                background: "hsl(var(--rs-warning))",
                top: 10,
                right: 10,
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <BellRing size={48} style={{ color: "hsl(var(--rs-warning))" }} />
            </div>
          </>
        }
      />

      <div className="rs-card">
        {rows.map((row) => (
          <Row key={row.key} title={row.title} description={row.desc}>
            <Switch
              checked={notifications[row.key]}
              onChange={(v) => setNotification(row.key, v)}
            />
          </Row>
        ))}
      </div>
    </section>
  );
}
