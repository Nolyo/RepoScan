import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { open } from "@tauri-apps/plugin-dialog";
import { toast } from "sonner";
import { X, FolderOpen, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { commands, type AppConfig, type UpdateChannel, type Language } from "../../bindings";
import { useConfig } from "../../hooks/useRepos";
import { useAppVersion, runUpdateCheck } from "../../hooks/useUpdater";
import { unwrap } from "../../lib/api";
import { useSettingsStore } from "../../stores/settings";
import i18n from "../../i18n";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function resolveLanguage(lang: Language | undefined): string {
  if (lang === "fr") return "fr";
  if (lang === "en") return "en";
  return navigator.language.startsWith("fr") ? "fr" : "en";
}

export default function SettingsDialog({ open: isOpen, onOpenChange }: Props) {
  const { data: config } = useConfig();
  const [form, setForm] = useState<AppConfig | null>(null);
  const { theme, setTheme } = useSettingsStore();
  const { data: appVersion } = useAppVersion();
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const { t } = useTranslation();
  const qc = useQueryClient();

  useEffect(() => {
    if (config && isOpen) setForm({ ...config });
  }, [config, isOpen]);

  const saveMutation = useMutation({
    mutationFn: async (c: AppConfig) => unwrap(await commands.saveConfig(c)),
    onSuccess: (_, saved) => {
      toast.success(t("settings.saved"));
      i18n.changeLanguage(resolveLanguage(saved.language));
      qc.invalidateQueries({ queryKey: ["config"] });
      qc.invalidateQueries({ queryKey: ["repos"] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(String(e)),
  });

  if (!form) return null;

  const pickFolder = async () => {
    const selected = await open({ directory: true, defaultPath: form.rootPath || undefined });
    if (typeof selected === "string") setForm((f) => f && { ...f, rootPath: selected });
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md rounded-xl border bg-background shadow-xl p-6 focus:outline-none">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-base font-semibold">{t("settings.title")}</Dialog.Title>
            <Dialog.Close className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="space-y-4">
            {/* Root path */}
            <Field label={t("settings.repoFolder")}>
              <div className="flex gap-2">
                <input
                  className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={form.rootPath}
                  onChange={(e) => setForm((f) => f && { ...f, rootPath: e.target.value })}
                />
                <button
                  onClick={pickFolder}
                  className="h-9 px-3 rounded-md border border-input bg-background hover:bg-accent text-sm inline-flex items-center gap-1.5"
                >
                  <FolderOpen className="h-4 w-4" />
                </button>
              </div>
            </Field>

            {/* Max scan depth */}
            <Field label={t("settings.scanDepth", { count: form.maxScanDepth })}>
              <input
                type="range"
                min={1}
                max={6}
                value={form.maxScanDepth}
                onChange={(e) =>
                  setForm((f) => f && { ...f, maxScanDepth: parseInt(e.target.value) })
                }
                className="w-full"
              />
            </Field>

            {/* Fetch concurrency */}
            <Field label={t("settings.fetchConcurrency", { count: form.fetchConcurrency })}>
              <input
                type="range"
                min={1}
                max={16}
                value={form.fetchConcurrency}
                onChange={(e) =>
                  setForm((f) => f && { ...f, fetchConcurrency: parseInt(e.target.value) })
                }
                className="w-full"
              />
            </Field>

            {/* Fetch timeout */}
            <Field label={t("settings.fetchTimeout", { count: form.fetchTimeoutSeconds })}>
              <input
                type="range"
                min={5}
                max={120}
                step={5}
                value={form.fetchTimeoutSeconds}
                onChange={(e) =>
                  setForm((f) => f && { ...f, fetchTimeoutSeconds: parseInt(e.target.value) })
                }
                className="w-full"
              />
            </Field>

            {/* GitHub org */}
            <Field label={t("settings.githubOrg")}>
              <input
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder={t("settings.githubOrgPlaceholder")}
                value={form.defaultGithubOwner ?? ""}
                onChange={(e) =>
                  setForm((f) => f && { ...f, defaultGithubOwner: e.target.value })
                }
              />
              <label className="flex items-center gap-2 text-xs text-muted-foreground select-none mt-1.5">
                <input
                  type="checkbox"
                  checked={form.githubSearchAll ?? false}
                  onChange={(e) =>
                    setForm((f) => f && { ...f, githubSearchAll: e.target.checked })
                  }
                />
                {t("settings.githubSearchAll")}
              </label>
              <label className="flex items-center gap-2 text-xs text-muted-foreground select-none mt-1.5">
                <input
                  type="checkbox"
                  checked={form.githubIntegrationsEnabled ?? false}
                  onChange={(e) =>
                    setForm(
                      (f) => f && { ...f, githubIntegrationsEnabled: e.target.checked },
                    )
                  }
                />
                {t("settings.githubShowPR")}
              </label>
            </Field>

            {/* Update channel */}
            <Field label={t("settings.updateChannel")}>
              <div className="flex gap-2">
                {(["stable", "beta"] as const).map((ch) => {
                  const current: UpdateChannel = form.updateChannel ?? "stable";
                  return (
                    <button
                      key={ch}
                      onClick={() => setForm((f) => f && { ...f, updateChannel: ch })}
                      className={`flex-1 h-8 text-xs rounded-md border capitalize ${
                        current === ch
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-input hover:bg-accent"
                      }`}
                    >
                      {ch === "stable" ? t("settings.updateChannelStable") : t("settings.updateChannelBeta")}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>{t("settings.version", { version: appVersion ?? "…" })}</span>
                <button
                  onClick={async () => {
                    setCheckingUpdate(true);
                    try {
                      await runUpdateCheck({ silent: false });
                    } finally {
                      setCheckingUpdate(false);
                    }
                  }}
                  disabled={checkingUpdate}
                  className="inline-flex items-center gap-1 hover:text-foreground disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${checkingUpdate ? "animate-spin" : ""}`} />
                  {t("settings.checkUpdate")}
                </button>
              </div>
            </Field>

            {/* Theme */}
            <Field label={t("settings.theme")}>
              <div className="flex gap-2">
                {(["system", "light", "dark"] as const).map((th) => (
                  <button
                    key={th}
                    onClick={() => setTheme(th)}
                    className={`flex-1 h-8 text-xs rounded-md border capitalize ${
                      theme === th
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-input hover:bg-accent"
                    }`}
                  >
                    {th === "system"
                      ? t("settings.themeSystem")
                      : th === "light"
                      ? t("settings.themeLight")
                      : t("settings.themeDark")}
                  </button>
                ))}
              </div>
            </Field>

            {/* Language */}
            <Field label={t("settings.language")}>
              <div className="flex gap-2">
                {(["system", "en", "fr"] as const).map((lang) => {
                  const current: Language = form.language ?? "system";
                  return (
                    <button
                      key={lang}
                      onClick={() => setForm((f) => f && { ...f, language: lang })}
                      className={`flex-1 h-8 text-xs rounded-md border ${
                        current === lang
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-input hover:bg-accent"
                      }`}
                    >
                      {lang === "system"
                        ? t("settings.langSystem")
                        : lang === "en"
                        ? t("settings.langEn")
                        : t("settings.langFr")}
                    </button>
                  );
                })}
              </div>
            </Field>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Dialog.Close className="h-9 px-4 text-sm rounded-md border border-input bg-background hover:bg-accent">
              {t("settings.cancel")}
            </Dialog.Close>
            <button
              onClick={() => saveMutation.mutate(form)}
              disabled={saveMutation.isPending}
              className="h-9 px-4 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saveMutation.isPending ? t("settings.saving") : t("settings.save")}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
