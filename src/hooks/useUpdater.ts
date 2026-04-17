import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { getVersion } from "@tauri-apps/api/app";
import { useQuery } from "@tanstack/react-query";
import { commands } from "../bindings";

export function useAppVersion() {
  return useQuery({
    queryKey: ["app-version"],
    queryFn: () => getVersion(),
    staleTime: Infinity,
  });
}

export async function runUpdateCheck(options: { silent: boolean }) {
  const result = await commands.checkForUpdate();
  if (result.status === "error") {
    if (!options.silent) toast.error(`Erreur updater : ${result.error}`);
    return null;
  }
  const info = result.data;
  if (!info) {
    if (!options.silent) toast.info("RepoScan est à jour.");
    return null;
  }

  toast.message(`Mise à jour disponible : ${info.version}`, {
    description: info.body?.slice(0, 240) ?? "Notes de release indisponibles.",
    duration: Infinity,
    action: {
      label: "Installer et redémarrer",
      onClick: async () => {
        toast.loading("Téléchargement et installation…", { id: "update-install" });
        const install = await commands.installUpdate();
        if (install.status === "error") {
          toast.error(`Installation échouée : ${install.error}`, { id: "update-install" });
        }
      },
    },
  });
  return info;
}

export function useStartupUpdateCheck() {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    const timer = setTimeout(() => {
      runUpdateCheck({ silent: true }).catch(() => {});
    }, 3000);
    return () => clearTimeout(timer);
  }, []);
}
