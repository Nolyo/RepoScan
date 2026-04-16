import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { open } from "@tauri-apps/plugin-dialog";
import { toast } from "sonner";
import { FolderOpen, GitBranch, ArrowRight, Check } from "lucide-react";
import { commands, type AppConfig } from "../bindings";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [rootPath, setRootPath] = useState("");
  const [maxDepth, setMaxDepth] = useState(3);

  // Auto-detect default path
  const { data: defaultPath } = useQuery({
    queryKey: ["default_repo_path"],
    queryFn: commands.detectDefaultRepoPath,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (defaultPath && !rootPath) setRootPath(defaultPath);
  }, [defaultPath, rootPath]);

  // Preview scan
  const { data: preview, isLoading: previewLoading } = useQuery({
    queryKey: ["preview", rootPath, maxDepth],
    queryFn: () => commands.previewScan(rootPath, maxDepth),
    enabled: !!rootPath && step === 1,
    staleTime: 30_000,
  });

  const saveMutation = useMutation({
    mutationFn: (config: AppConfig) => commands.saveConfig(config),
    onSuccess: () => {
      toast.success("Configuration enregistrée !");
      navigate("/main", { replace: true });
    },
    onError: (e) => toast.error(String(e)),
  });

  const pickFolder = async () => {
    const selected = await open({ directory: true, defaultPath: rootPath || undefined });
    if (typeof selected === "string") setRootPath(selected);
  };

  const handleFinish = () => {
    const config: AppConfig = {
      rootPath,
      maxScanDepth: maxDepth,
      showEmptyFolders: true,
      fetchTimeoutSeconds: 30,
      fetchConcurrency: 8,
      theme: "system",
      window: { width: 1400, height: 900 },
      preferredEditor: "vsCode",
      version: 1,
    };
    saveMutation.mutate(config);
  };

  const steps = [
    {
      title: "Bienvenue dans RepoScan",
      subtitle: "Votre tableau de bord de dépôts Git locaux",
      content: (
        <div className="flex flex-col items-center gap-6 py-6">
          <div className="rounded-full bg-primary/10 p-6">
            <GitBranch className="h-12 w-12 text-primary" />
          </div>
          <div className="max-w-sm text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              RepoScan scanne vos dossiers locaux et affiche l'état de chaque dépôt Git : branche,
              statut, dernier commit, avance/retard sur le remote.
            </p>
            <p className="text-sm text-muted-foreground">
              Fetch en parallèle, ouverture directe dans votre éditeur, copie de chemin… tout en un clic.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Dossier à scanner",
      subtitle: "Choisissez votre dossier racine contenant vos projets",
      content: (
        <div className="flex flex-col gap-5">
          <div className="flex gap-2">
            <input
              className="flex-1 h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={rootPath}
              onChange={(e) => setRootPath(e.target.value)}
              placeholder="/home/you/www"
            />
            <button
              onClick={pickFolder}
              className="inline-flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm"
            >
              <FolderOpen className="h-4 w-4" />
              Parcourir
            </button>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              Profondeur max :
            </label>
            <input
              type="range"
              min={1}
              max={6}
              value={maxDepth}
              onChange={(e) => setMaxDepth(parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="w-5 text-sm font-mono text-center">{maxDepth}</span>
          </div>

          {rootPath && (
            <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-1 min-h-[72px]">
              {previewLoading ? (
                <span className="text-muted-foreground">Analyse en cours…</span>
              ) : preview ? (
                <>
                  <p className="font-medium">
                    <span className="text-primary">{preview.reposCount}</span> dépôts trouvés
                    dans <span className="text-primary">{preview.foldersCount}</span> dossiers
                  </p>
                  {preview.sample.length > 0 && (
                    <ul className="text-muted-foreground space-y-0.5 pt-1">
                      {preview.sample.map((s) => (
                        <li key={s} className="font-mono text-xs truncate">
                          {s}
                        </li>
                      ))}
                      {preview.reposCount > preview.sample.length && (
                        <li className="text-xs">…et {preview.reposCount - preview.sample.length} autres</li>
                      )}
                    </ul>
                  )}
                </>
              ) : (
                <span className="text-muted-foreground">Saisissez un chemin valide</span>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Tout est prêt",
      subtitle: "Votre configuration a été enregistrée",
      content: (
        <div className="flex flex-col items-center gap-6 py-6">
          <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-6">
            <Check className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
          <div className="max-w-sm text-center text-sm text-muted-foreground space-y-1">
            <p>
              Dossier : <span className="font-mono text-foreground break-all">{rootPath}</span>
            </p>
            <p>Profondeur de scan : {maxDepth}</p>
          </div>
        </div>
      ),
    },
  ];

  const currentStep = steps[step];
  const isLast = step === steps.length - 1;
  const canNext = step === 0 || (step === 1 && !!rootPath);

  return (
    <div className="flex h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg rounded-xl border bg-card shadow-lg">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-2 mb-4">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
          <h1 className="text-xl font-semibold tracking-tight">{currentStep.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{currentStep.subtitle}</p>
        </div>

        {/* Content */}
        <div className="p-6">{currentStep.content}</div>

        {/* Footer */}
        <div className="p-6 border-t flex justify-between">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="h-9 px-4 text-sm rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none"
          >
            Retour
          </button>
          <button
            onClick={() => {
              if (isLast) {
                handleFinish();
              } else {
                setStep((s) => s + 1);
              }
            }}
            disabled={!canNext || saveMutation.isPending}
            className="inline-flex items-center gap-2 h-9 px-4 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLast ? (saveMutation.isPending ? "Enregistrement…" : "Lancer RepoScan") : (
              <>Suivant <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
