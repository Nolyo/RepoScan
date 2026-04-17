import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { open } from "@tauri-apps/plugin-dialog";
import { toast } from "sonner";
import { X, FolderOpen } from "lucide-react";
import { commands, type AppConfig } from "../../bindings";
import { useConfig } from "../../hooks/useRepos";
import { unwrap } from "../../lib/api";
import { useSettingsStore } from "../../stores/settings";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsDialog({ open: isOpen, onOpenChange }: Props) {
  const { data: config } = useConfig();
  const [form, setForm] = useState<AppConfig | null>(null);
  const { theme, setTheme } = useSettingsStore();
  const qc = useQueryClient();

  useEffect(() => {
    if (config && isOpen) setForm({ ...config });
  }, [config, isOpen]);

  const saveMutation = useMutation({
    mutationFn: async (c: AppConfig) => unwrap(await commands.saveConfig(c)),
    onSuccess: () => {
      toast.success("Paramètres sauvegardés");
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
            <Dialog.Title className="text-base font-semibold">Paramètres</Dialog.Title>
            <Dialog.Close className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="space-y-4">
            {/* Root path */}
            <Field label="Dossier de repos">
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
            <Field label={`Profondeur de scan : ${form.maxScanDepth}`}>
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
            <Field label={`Fetch simultanés : ${form.fetchConcurrency}`}>
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
            <Field label={`Timeout fetch : ${form.fetchTimeoutSeconds}s`}>
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
            <Field label="Organisation GitHub par défaut">
              <input
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="ex. kering-technologies"
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
                Chercher sur tout GitHub par défaut
              </label>
            </Field>

            {/* Theme */}
            <Field label="Thème">
              <div className="flex gap-2">
                {(["system", "light", "dark"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`flex-1 h-8 text-xs rounded-md border capitalize ${
                      theme === t
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-input hover:bg-accent"
                    }`}
                  >
                    {t === "system" ? "Système" : t === "light" ? "Clair" : "Sombre"}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Dialog.Close className="h-9 px-4 text-sm rounded-md border border-input bg-background hover:bg-accent">
              Annuler
            </Dialog.Close>
            <button
              onClick={() => saveMutation.mutate(form)}
              disabled={saveMutation.isPending}
              className="h-9 px-4 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saveMutation.isPending ? "Sauvegarde…" : "Sauvegarder"}
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
