import { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { toast } from "sonner";
import { open as openFolderDialog } from "@tauri-apps/plugin-dialog";
import {
  ChevronDown,
  Folder,
  FolderOpen,
  GitBranch,
  Monitor,
  SlidersHorizontal,
  Check,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { commands, type AppConfig, type Editor, type Language } from "../../../bindings";
import { useAvailableEditors } from "../../../hooks/useRepos";
import { Row, SectionHero, SegmentedControl, Switch } from "../widgets";

const EDITOR_LABELS: Record<string, string> = {
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
  system: "System default",
};

export default function GeneralSection({
  form,
  update,
}: {
  form: AppConfig;
  update: (patch: Partial<AppConfig>) => void;
}) {
  const { t } = useTranslation();
  const { data: availableEditors = [] } = useAvailableEditors();
  const [scanPreview, setScanPreview] = useState<string[] | null>(null);

  const pickFolder = async () => {
    try {
      const selected = await openFolderDialog({
        directory: true,
        defaultPath: form.rootPath || undefined,
      });
      if (typeof selected === "string") update({ rootPath: selected });
    } catch (e) {
      toast.error(String(e));
    }
  };

  const refreshPreview = async () => {
    try {
      const preview = await commands.previewScan(
        form.rootPath,
        form.maxScanDepth,
      );
      setScanPreview(preview.sample.slice(0, 4));
    } catch {
      setScanPreview(null);
    }
  };

  const langOptions = [
    { value: "system" as Language, label: t("settings.langSystem"), icon: <Monitor size={13} /> },
    { value: "en" as Language, label: "English" },
    { value: "fr" as Language, label: "Français" },
  ];

  const preferredEditor = form.preferredEditor ?? availableEditors[0] ?? "system";
  const editorLabel = EDITOR_LABELS[preferredEditor] ?? preferredEditor;

  return (
    <section id="rs-sect-general" className="rs-section">
      <SectionHero
        eyebrow={
          <>
            <SlidersHorizontal size={13} />
            {t("settings.nav.general")}
          </>
        }
        title={t("settings.general.heroTitle")}
        description={t("settings.general.heroDesc")}
        illustration={
          <>
            <div
              className="rs-ill-blob"
              style={{
                width: 140,
                height: 140,
                background: "hsl(var(--rs-accent))",
                top: -30,
                right: -30,
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="flex flex-col gap-1.5 font-mono text-[11px]"
                style={{ color: "hsl(var(--rs-muted-fg))" }}
              >
                {(scanPreview && scanPreview.length > 0
                  ? scanPreview
                  : ["~/projects", "reposcan", "dashboard", "work/"]
                ).map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    {i === 0 || item.endsWith("/") ? (
                      <Folder size={12} style={{ color: "hsl(var(--rs-accent))" }} />
                    ) : (
                      <GitBranch size={12} />
                    )}
                    <span className={i === 0 ? "" : "pl-3"}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        }
      />

      <div className="rs-card">
        <Row
          title={t("settings.general.repoFolder")}
          description={t("settings.general.repoFolderDesc")}
        >
          <div className="flex gap-2" style={{ minWidth: 360 }}>
            <input
              className="rs-input"
              value={form.rootPath}
              onChange={(e) => update({ rootPath: e.target.value })}
              onBlur={refreshPreview}
            />
            <button className="rs-btn" title={t("settings.general.browse")} onClick={pickFolder}>
              <FolderOpen size={14} />
            </button>
          </div>
        </Row>

        <Row
          title={t("settings.general.language")}
          description={t("settings.general.languageDesc")}
        >
          <SegmentedControl<Language>
            options={langOptions}
            value={(form.language ?? "system") as Language}
            onChange={(v) => update({ language: v })}
          />
        </Row>

        <Row
          title={t("settings.general.showEmpty")}
          description={t("settings.general.showEmptyDesc")}
        >
          <Switch
            checked={form.showEmptyFolders}
            onChange={(v) => update({ showEmptyFolders: v })}
          />
        </Row>

        <Row
          title={t("settings.general.editor")}
          description={t("settings.general.editorDesc")}
        >
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="rs-btn rs-input-sans">
                <span
                  className="w-4 h-4 rounded-sm"
                  style={{ background: "linear-gradient(135deg,#007acc,#1e88e5)" }}
                />
                <span className="text-[13px]">{editorLabel}</span>
                <ChevronDown
                  size={14}
                  style={{ color: "hsl(var(--rs-muted-fg))" }}
                />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={4}
                className="rs-card min-w-[200px] py-1 shadow-xl"
                style={{ zIndex: 50 }}
              >
                {(availableEditors.length > 0 ? availableEditors : (["system"] as Editor[])).map(
                  (ed) => (
                    <DropdownMenu.Item
                      key={ed}
                      className="flex items-center gap-2 px-3 py-1.5 text-[13px] outline-none cursor-pointer"
                      style={{
                        color:
                          ed === preferredEditor
                            ? "hsl(var(--rs-accent))"
                            : "hsl(var(--rs-fg))",
                      }}
                      onSelect={() => update({ preferredEditor: ed })}
                    >
                      {ed === preferredEditor ? (
                        <Check size={12} />
                      ) : (
                        <span style={{ width: 12 }} />
                      )}
                      {EDITOR_LABELS[ed] ?? ed}
                    </DropdownMenu.Item>
                  ),
                )}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </Row>
      </div>
    </section>
  );
}
