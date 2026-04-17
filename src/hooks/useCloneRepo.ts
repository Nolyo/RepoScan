import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { listen } from "@tauri-apps/api/event";
import { toast } from "sonner";
import { commands, type CloneProgress, type Editor } from "../bindings";
import { unwrap } from "../lib/api";
import { useInvalidateRepos } from "./useRepos";

export type CloneOptions = {
  fullName: string;
  destParent: string;
  installDeps: boolean;
  openEditor: boolean;
  editor: Editor;
};

export function useCloneProgress() {
  const [progress, setProgress] = useState<CloneProgress | null>(null);

  useEffect(() => {
    const unlisten = listen<CloneProgress>("clone_progress", (event) => {
      setProgress(event.payload);
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  return { progress, reset: () => setProgress(null) };
}

export function useCloneRepo(onDone?: () => void) {
  const invalidateRepos = useInvalidateRepos();

  return useMutation({
    mutationFn: async (opts: CloneOptions) => {
      const outcome = unwrap(
        await commands.cloneGithubRepo(opts.fullName, opts.destParent),
      );

      if (opts.installDeps && outcome.depManager) {
        try {
          unwrap(
            await commands.installRepoDeps(outcome.clonePath, outcome.depManager),
          );
        } catch (e) {
          toast.error(`Installation échouée : ${String(e)}`);
        }
      }

      if (opts.openEditor) {
        try {
          unwrap(await commands.openInEditor(outcome.clonePath, opts.editor));
        } catch (e) {
          toast.error(`Ouverture éditeur échouée : ${String(e)}`);
        }
      }

      return outcome;
    },
    onSuccess: (outcome) => {
      toast.success(`Dépôt cloné : ${outcome.clonePath}`);
      invalidateRepos();
      onDone?.();
    },
    onError: (e) => toast.error(String(e)),
  });
}
