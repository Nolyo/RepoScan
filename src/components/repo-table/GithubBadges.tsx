import { toast } from "sonner";
import { GitPullRequest, CheckCircle2, XCircle, Clock, CircleDashed } from "lucide-react";
import { useTranslation } from "react-i18next";
import { commands, type RepoIntegration, type CiState } from "../../bindings";
import { cn } from "../../lib/utils";
import { unwrap } from "../../lib/api";

interface Props {
  integration: RepoIntegration | undefined;
  loading: boolean;
}

function ciIcon(state: CiState | null | undefined) {
  switch (state) {
    case "success":
      return { Icon: CheckCircle2, className: "text-green-600 dark:text-green-400" };
    case "failure":
      return { Icon: XCircle, className: "text-red-600 dark:text-red-400" };
    case "pending":
      return { Icon: Clock, className: "text-amber-600 dark:text-amber-400" };
    case "neutral":
      return { Icon: CircleDashed, className: "text-muted-foreground" };
    default:
      return null;
  }
}

async function openUrl(url: string) {
  try {
    unwrap(await commands.openRemoteUrl(url));
  } catch (e) {
    toast.error(String(e));
  }
}

export default function GithubBadges({ integration, loading }: Props) {
  const { t } = useTranslation();

  if (loading && !integration) {
    return <span className="text-xs text-muted-foreground">…</span>;
  }

  if (!integration) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const { prCount, prUrl, ciState, ciUrl, ciWorkflowName } = integration;
  const hasPr = typeof prCount === "number" && prCount > 0 && prUrl;
  const ci = ciIcon(ciState);
  const ciTitle = ci
    ? `${ciWorkflowName ?? t("github.ciFallback")} · ${t(`github.ci.${ciState ?? "unknown"}`)}`
    : "";

  return (
    <span className="inline-flex items-center gap-2">
      {hasPr ? (
        <button
          type="button"
          onClick={() => openUrl(prUrl!)}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
            "bg-violet-100 text-violet-800 hover:bg-violet-200",
            "dark:bg-violet-900/30 dark:text-violet-300 dark:hover:bg-violet-900/50",
          )}
          title={t("github.prOpen", { count: prCount! })}
        >
          <GitPullRequest className="h-3 w-3" />
          {prCount}
        </button>
      ) : (
        <span className="text-xs text-muted-foreground">·</span>
      )}

      {ci && ciUrl ? (
        <button
          type="button"
          onClick={() => openUrl(ciUrl)}
          className={cn("inline-flex items-center", ci.className)}
          title={ciTitle}
        >
          <ci.Icon className="h-4 w-4" />
        </button>
      ) : ci ? (
        <span
          className={cn("inline-flex items-center", ci.className)}
          title={ciTitle}
        >
          <ci.Icon className="h-4 w-4" />
        </span>
      ) : null}
    </span>
  );
}
