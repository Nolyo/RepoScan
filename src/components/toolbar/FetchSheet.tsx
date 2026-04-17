import { CheckCircle2, X, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useUiStore } from "../../stores/ui";
import type { FetchProgressMap } from "../../hooks/useFetchProgress";

interface Props {
  progress: FetchProgressMap;
}

export default function FetchSheet({ progress }: Props) {
  const { isFetchSheetOpen, setFetchSheetOpen } = useUiStore();
  const { t } = useTranslation();
  const entries = Object.values(progress);

  const done = entries.filter((e) => e.phase === "done").length;
  const errors = entries.filter((e) => e.phase === "error").length;
  const total = entries[0]?.reposTotal ?? entries.length;
  const completed = done + errors;
  const pct = total > 0 ? (completed / total) * 100 : 0;
  const running = total === 0 || completed < total;

  return (
    <div className="rs-fetch-sheet" data-open={isFetchSheetOpen ? "true" : "false"}>
      <div className="rs-fetch-head">
        <span className="rs-fetch-icon">
          {running ? <span className="rs-spin-ring" /> : <CheckCircle2 size={16} className="text-[hsl(var(--rs-success))]" />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="rs-fetch-title">
            {running ? t("fetch.title") : t("fetch.done")}
          </div>
          <div className="rs-fetch-sub">
            {t("fetch.progress", { done: completed, total })}
            {errors > 0 && t("fetch.progressErrors", { count: errors })}
          </div>
        </div>
        <button
          className="rs-ibtn"
          onClick={() => setFetchSheetOpen(false)}
          aria-label="Close"
        >
          <X size={14} />
        </button>
      </div>
      <div className="rs-fetch-progress">
        <div className="rs-fetch-progress-bar" style={{ width: `${pct}%` }} />
      </div>
      {entries.length > 0 && (
        <div className="rs-fetch-log">
          {entries.map((entry) => {
            const cls =
              entry.phase === "done"
                ? "ok"
                : entry.phase === "error"
                ? "err"
                : entry.phase === "running"
                ? "running"
                : "queued";
            const glyph =
              entry.phase === "done"
                ? <CheckCircle2 className="rs-fetch-ico" />
                : entry.phase === "error"
                ? <XCircle className="rs-fetch-ico" />
                : entry.phase === "running"
                ? <span className="rs-spin-ring" style={{ width: 11, height: 11, borderWidth: 1.5 }} />
                : <span className="rs-fetch-ico" />;
            return (
              <div key={entry.repoPath} className={`rs-fetch-log-entry ${cls}`}>
                {glyph}
                <span className="truncate flex-1">{entry.repoName}</span>
                {entry.message && (
                  <span className="truncate text-[10.5px] opacity-70 max-w-[120px]">
                    {entry.message}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
