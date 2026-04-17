import { Command } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Kbd, Row, SectionHero } from "../widgets";

export default function ShortcutsSection() {
  const { t } = useTranslation();

  const navigation = [
    {
      title: t("settings.shortcuts.openClone"),
      desc: t("settings.shortcuts.openCloneDesc"),
      keys: ["Ctrl", "K"],
    },
    {
      title: t("settings.shortcuts.openSettings"),
      desc: t("settings.shortcuts.openSettingsDesc"),
      keys: ["Ctrl", ","],
    },
    {
      title: t("settings.shortcuts.focusSearch"),
      desc: t("settings.shortcuts.focusSearchDesc"),
      keys: ["/"],
    },
  ];

  const actions = [
    {
      title: t("settings.shortcuts.fetchAll"),
      desc: t("settings.shortcuts.fetchAllDesc"),
      keys: ["Ctrl", "Shift", "F"],
    },
    {
      title: t("settings.shortcuts.refresh"),
      desc: t("settings.shortcuts.refreshDesc"),
      keys: ["Ctrl", "R"],
    },
    {
      title: t("settings.shortcuts.copyPath"),
      desc: t("settings.shortcuts.copyPathDesc"),
      keys: ["Ctrl", "C"],
    },
  ];

  return (
    <section id="rs-sect-shortcuts" className="rs-section">
      <SectionHero
        eyebrow={
          <>
            <Command size={13} />
            {t("settings.nav.shortcuts")}
          </>
        }
        title={t("settings.shortcuts.heroTitle")}
        description={t("settings.shortcuts.heroDesc")}
        illustration={
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col gap-1.5 items-center">
              <div className="flex gap-1">
                <Kbd>⌘</Kbd>
                <Kbd>K</Kbd>
              </div>
              <div className="flex gap-1">
                <Kbd>⌘</Kbd>
                <Kbd>,</Kbd>
              </div>
            </div>
          </div>
        }
      />

      <div className="rs-card overflow-hidden">
        <GroupHeader label={t("settings.shortcuts.navGroup")} />
        {navigation.map((item, i) => (
          <Row key={i} title={item.title} description={item.desc}>
            <div className="flex gap-1">
              {item.keys.map((k, j) => (
                <Kbd key={j}>{k}</Kbd>
              ))}
            </div>
          </Row>
        ))}

        <GroupHeader label={t("settings.shortcuts.actionsGroup")} withBorderTop />
        {actions.map((item, i) => (
          <Row key={i} title={item.title} description={item.desc}>
            <div className="flex gap-1">
              {item.keys.map((k, j) => (
                <Kbd key={j}>{k}</Kbd>
              ))}
            </div>
          </Row>
        ))}
      </div>
    </section>
  );
}

function GroupHeader({
  label,
  withBorderTop,
}: {
  label: string;
  withBorderTop?: boolean;
}) {
  return (
    <div
      className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-[.08em] border-b ${
        withBorderTop ? "border-t" : ""
      }`}
      style={{
        color: "hsl(var(--rs-muted-fg))",
        borderColor: "hsl(var(--rs-border))",
      }}
    >
      {label}
    </div>
  );
}
