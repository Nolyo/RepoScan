import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { commands, type AppConfig, type Language } from "../../bindings";
import { unwrap } from "../../lib/api";
import i18n from "../../i18n";

export type SaveState = "idle" | "saving" | "saved" | "error";

function resolveLanguage(lang: Language | undefined): string {
  if (lang === "fr") return "fr";
  if (lang === "en") return "en";
  return navigator.language.startsWith("fr") ? "fr" : "en";
}

export function useAutoSaveConfig(
  initial: AppConfig | undefined | null,
  opts: { debounceMs?: number } = {},
) {
  const debounceMs = opts.debounceMs ?? 500;
  const qc = useQueryClient();

  const [form, setForm] = useState<AppConfig | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const lastSavedRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!initial) return;
    const serialized = JSON.stringify(initial);
    if (lastSavedRef.current === serialized) return;
    lastSavedRef.current = serialized;
    setForm({ ...initial });
  }, [initial]);

  const update = useCallback((patch: Partial<AppConfig>) => {
    setForm((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  useEffect(() => {
    if (!form) return;
    const serialized = JSON.stringify(form);
    if (serialized === lastSavedRef.current) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    setSaveState("saving");

    timerRef.current = setTimeout(async () => {
      try {
        unwrap(await commands.saveConfig(form));
        lastSavedRef.current = serialized;
        setSaveState("saved");
        i18n.changeLanguage(resolveLanguage(form.language));
        qc.invalidateQueries({ queryKey: ["config"] });
        qc.invalidateQueries({ queryKey: ["repos"] });
      } catch (e) {
        setSaveState("error");
        toast.error(i18n.t("settings.saveError") + " : " + String(e));
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [form, debounceMs, qc]);

  return { form, setForm, update, saveState };
}
