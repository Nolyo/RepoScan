import { cn } from "../../lib/utils";
import type { RepoStatus, AheadBehind } from "../../bindings";
import { statusSummary } from "../../lib/repoUtils";

export function StatusBadge({ status }: { status: RepoStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        status.clean
          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
          : status.conflicted > 0
          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
          : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
      )}
    >
      {statusSummary(status)}
    </span>
  );
}

export function SyncBadge({ ab }: { ab: AheadBehind | null }) {
  if (!ab) return <span className="text-muted-foreground text-xs">—</span>;
  if (!ab.hasUpstream)
    return <span className="text-xs text-muted-foreground">no upstream</span>;
  if (ab.ahead === 0 && ab.behind === 0)
    return <span className="text-xs text-muted-foreground">✓</span>;

  return (
    <span className="inline-flex items-center gap-1 text-xs font-mono">
      {ab.ahead > 0 && (
        <span className="text-blue-600 dark:text-blue-400">↑{ab.ahead}</span>
      )}
      {ab.behind > 0 && (
        <span className="text-orange-600 dark:text-orange-400">↓{ab.behind}</span>
      )}
    </span>
  );
}
