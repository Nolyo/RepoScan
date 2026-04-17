import { useTranslation } from "react-i18next";
import type { RepoStatus, AheadBehind } from "../../bindings";
import { statusSummary } from "../../lib/repoUtils";

export function StatusBadge({ status }: { status: RepoStatus }) {
  const { t } = useTranslation();
  const isConflict = status.conflicted > 0;
  const isClean = status.clean;

  const label = isClean
    ? t("status.clean")
    : isConflict
    ? t("status.conflict")
    : t("status.dirty");

  const cls = isClean
    ? "rs-pill rs-pill-clean"
    : isConflict
    ? "rs-pill rs-pill-conflict"
    : "rs-pill rs-pill-dirty";

  return (
    <span className={cls} title={isClean ? label : statusSummary(status)}>
      <span className="rs-pill-dot" />
      {label}
    </span>
  );
}

export function SyncBadge({ ab }: { ab: AheadBehind | null }) {
  const { t } = useTranslation();
  if (!ab) return <span className="rs-sync-none">—</span>;
  if (!ab.hasUpstream) return <span className="rs-sync-none">{t("sync.noUpstream")}</span>;
  if (ab.ahead === 0 && ab.behind === 0)
    return <span className="rs-sync-ok">✓</span>;

  return (
    <span className="inline-flex items-center gap-2">
      {ab.ahead > 0 && <span className="rs-sync-ahead">↑{ab.ahead}</span>}
      {ab.behind > 0 && <span className="rs-sync-behind">↓{ab.behind}</span>}
    </span>
  );
}
