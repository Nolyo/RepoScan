import { toast } from "sonner";
import { GitPullRequest, CheckCircle2, XCircle, Clock, CircleDashed } from "lucide-react";
import { useTranslation } from "react-i18next";
import { commands, type RepoIntegration, type CiState } from "../../bindings";
import { unwrap } from "../../lib/api";

interface Props {
  integration: RepoIntegration | undefined;
  loading: boolean;
}

function ciIconFor(state: CiState | null | undefined) {
  switch (state) {
    case "success":
      return { Icon: CheckCircle2, cls: "rs-gh-ci rs-gh-ci-ok" };
    case "failure":
      return { Icon: XCircle, cls: "rs-gh-ci rs-gh-ci-fail" };
    case "pending":
      return { Icon: Clock, cls: "rs-gh-ci rs-gh-ci-pending" };
    case "neutral":
      return { Icon: CircleDashed, cls: "rs-gh-ci rs-gh-ci-neutral" };
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
    return <span className="rs-gh-empty">…</span>;
  }

  if (!integration) {
    return <span className="rs-gh-empty">—</span>;
  }

  const { prCount, prUrl, ciState, ciUrl, ciWorkflowName } = integration;
  const hasPr = typeof prCount === "number" && prCount > 0 && prUrl;
  const ci = ciIconFor(ciState);
  const ciTitle = ci
    ? `${ciWorkflowName ?? t("github.ciFallback")} · ${t(`github.ci.${ciState ?? "unknown"}`)}`
    : "";

  return (
    <span className="rs-gh-wrap">
      {hasPr ? (
        <button
          type="button"
          onClick={() => openUrl(prUrl!)}
          className="rs-gh-pr"
          title={t("github.prOpen", { count: prCount! })}
        >
          <GitPullRequest size={11} />
          {prCount}
        </button>
      ) : (
        <span className="rs-gh-empty" title={t("github.noPr")}>·</span>
      )}

      {ci && ciUrl ? (
        <button
          type="button"
          onClick={() => openUrl(ciUrl)}
          className={ci.cls}
          title={ciTitle}
        >
          <ci.Icon size={14} />
        </button>
      ) : ci ? (
        <span className={ci.cls} title={ciTitle}>
          <ci.Icon size={14} />
        </span>
      ) : null}
    </span>
  );
}
