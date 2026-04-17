import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { getVersion } from "@tauri-apps/api/app";
import { useQuery } from "@tanstack/react-query";
import i18n from "../i18n";
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
    if (!options.silent) toast.error(i18n.t("updater.error", { error: result.error }));
    return null;
  }
  const info = result.data;
  if (!info) {
    if (!options.silent) toast.info(i18n.t("updater.upToDate"));
    return null;
  }

  toast.message(i18n.t("updater.available", { version: info.version }), {
    description: info.body?.slice(0, 240) ?? i18n.t("updater.notesUnavailable"),
    duration: Infinity,
    action: {
      label: i18n.t("updater.installRestart"),
      onClick: async () => {
        toast.loading(i18n.t("updater.installing"), { id: "update-install" });
        const install = await commands.installUpdate();
        if (install.status === "error") {
          toast.error(i18n.t("updater.installFailed", { error: install.error }), {
            id: "update-install",
          });
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
