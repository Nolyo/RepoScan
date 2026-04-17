import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate } from "react-router-dom";
import { useConfig } from "../hooks/useRepos";
import { SettingsLayout, settingsIcons, type NavItem } from "../components/settings/SettingsLayout";
import { useAutoSaveConfig } from "../components/settings/useAutoSaveConfig";
import GeneralSection from "../components/settings/sections/General";
import ScanSection from "../components/settings/sections/Scan";
import GithubSection from "../components/settings/sections/Github";
import AppearanceSection from "../components/settings/sections/Appearance";
import NotificationsSection from "../components/settings/sections/Notifications";
import ShortcutsSection from "../components/settings/sections/Shortcuts";
import UpdatesSection from "../components/settings/sections/Updates";
import AdvancedSection from "../components/settings/sections/Advanced";
import AboutSection from "../components/settings/sections/About";

export default function SettingsPage() {
  const { t } = useTranslation();
  const { data: config, isLoading } = useConfig();
  const { form, update, saveState } = useAutoSaveConfig(config);
  const [activeId, setActiveId] = useState<string>("general");

  const navGroups: { label: string; items: NavItem[] }[] = [
    {
      label: t("settings.navGroup.preferences"),
      items: [
        { id: "general", label: t("settings.nav.general"), icon: settingsIcons.general },
        { id: "scan", label: t("settings.nav.scan"), icon: settingsIcons.scan },
        { id: "github", label: t("settings.nav.github"), icon: settingsIcons.github },
        { id: "appearance", label: t("settings.nav.appearance"), icon: settingsIcons.appearance },
        { id: "notifications", label: t("settings.nav.notifications"), icon: settingsIcons.notifications },
        { id: "shortcuts", label: t("settings.nav.shortcuts"), icon: settingsIcons.shortcuts },
      ],
    },
    {
      label: t("settings.navGroup.system"),
      items: [
        { id: "updates", label: t("settings.nav.updates"), icon: settingsIcons.updates },
        { id: "advanced", label: t("settings.nav.advanced"), icon: settingsIcons.advanced },
        { id: "about", label: t("settings.nav.about"), icon: settingsIcons.about },
      ],
    },
  ];

  const sectionTitleById: Record<string, string> = {
    general: t("settings.nav.general"),
    scan: t("settings.nav.scan"),
    github: t("settings.nav.github"),
    appearance: t("settings.nav.appearance"),
    notifications: t("settings.nav.notifications"),
    shortcuts: t("settings.nav.shortcuts"),
    updates: t("settings.nav.updates"),
    advanced: t("settings.nav.advanced"),
    about: t("settings.nav.about"),
  };

  if (isLoading || !form) {
    if (!isLoading && !config) return <Navigate to="/onboarding" replace />;
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">{t("app.loading")}</div>
      </div>
    );
  }

  return (
    <SettingsLayout
      saveState={saveState}
      activeId={activeId}
      setActiveId={setActiveId}
      sectionTitle={sectionTitleById[activeId] ?? ""}
      navGroups={navGroups}
    >
      <GeneralSection form={form} update={update} />
      <ScanSection form={form} update={update} />
      <GithubSection form={form} update={update} />
      <AppearanceSection />
      <NotificationsSection />
      <ShortcutsSection />
      <UpdatesSection form={form} update={update} />
      <AdvancedSection />
      <AboutSection form={form} />
    </SettingsLayout>
  );
}
