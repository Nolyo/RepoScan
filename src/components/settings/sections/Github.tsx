import { Check, LogOut, RefreshCw, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { commands, type AppConfig } from "../../../bindings";
import { useRefreshGithubIntegrations } from "../../../hooks/useGithubIntegrations";
import { GithubMark, Row, SectionHero, Switch } from "../widgets";

export default function GithubSection({
  form,
  update,
}: {
  form: AppConfig;
  update: (patch: Partial<AppConfig>) => void;
}) {
  const { t } = useTranslation();
  const refresh = useRefreshGithubIntegrations();

  const { data: ghStatus } = useQuery({
    queryKey: ["gh-auth"],
    queryFn: commands.checkGhAuth,
    staleTime: 30_000,
  });

  const authenticated = !!ghStatus?.loggedIn;
  const ghMissing = !!ghStatus?.ghMissing;

  return (
    <section id="rs-sect-github" className="rs-section">
      <SectionHero
        eyebrow={
          <>
            <GithubMark size={13} /> GitHub
          </>
        }
        title={t("settings.github.heroTitle")}
        description={t("settings.github.heroDesc")}
        illustration={
          <>
            <div
              className="rs-ill-blob"
              style={{
                width: 140,
                height: 140,
                background: "hsl(280 80% 60%)",
                top: -40,
                right: -30,
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col gap-1 font-mono text-[10px]">
                {[
                  { color: "hsl(var(--rs-success))", label: t("settings.github.sample.pr") },
                  { color: "hsl(var(--rs-warning))", label: t("settings.github.sample.ci") },
                  { color: "hsl(var(--rs-danger))", label: t("settings.github.sample.ciFail") },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-2 py-1 rounded border"
                    style={{
                      borderColor: "hsl(var(--rs-border))",
                      background: "hsl(var(--rs-bg))",
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: item.color }}
                    />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        }
      />

      {/* gh status banner */}
      <div
        className="rs-card mb-4 p-3.5 flex items-center gap-3"
        style={{
          background: authenticated
            ? "hsl(142 71% 45% / .08)"
            : "hsl(var(--rs-warning) / .08)",
          borderColor: authenticated
            ? "hsl(var(--rs-success) / .3)"
            : "hsl(var(--rs-warning) / .3)",
        }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{
            background: authenticated
              ? "hsl(var(--rs-success) / .15)"
              : "hsl(var(--rs-warning) / .15)",
            color: authenticated
              ? "hsl(var(--rs-success))"
              : "hsl(var(--rs-warning))",
          }}
        >
          {authenticated ? <Check size={16} /> : <AlertTriangle size={16} />}
        </div>
        <div className="flex-1">
          <div className="text-[13px] font-semibold">
            {authenticated
              ? t("settings.github.authenticated")
              : ghMissing
                ? t("settings.github.ghMissing")
                : t("settings.github.notLoggedIn")}
          </div>
          <div
            className="text-[12px]"
            style={{ color: "hsl(var(--rs-muted-fg))" }}
          >
            {authenticated && ghStatus?.user && (
              <>
                via <span className="font-mono">gh</span> —{" "}
                <span className="font-mono">{ghStatus.user}</span>
              </>
            )}
            {!authenticated && (
              <span className="font-mono">gh auth login</span>
            )}
          </div>
        </div>
        {authenticated && (
          <button
            className="rs-btn rs-btn-ghost text-[12px]"
            disabled
            title="gh auth logout"
          >
            <LogOut size={13} />
            {t("settings.github.logout")}
          </button>
        )}
      </div>

      <div className="rs-card">
        <Row
          title={t("settings.github.defaultOrg")}
          description={t("settings.github.defaultOrgDesc")}
        >
          <div style={{ minWidth: 320 }}>
            <input
              className="rs-input rs-input-sans"
              placeholder={t("settings.github.defaultOrgPlaceholder")}
              value={form.defaultGithubOwner ?? ""}
              onChange={(e) => update({ defaultGithubOwner: e.target.value })}
            />
          </div>
        </Row>

        <Row
          title={t("settings.github.searchAll")}
          description={t("settings.github.searchAllDesc")}
        >
          <Switch
            checked={form.githubSearchAll ?? false}
            onChange={(v) => update({ githubSearchAll: v })}
          />
        </Row>

        <Row
          title={t("settings.github.integrations")}
          description={t("settings.github.integrationsDesc")}
        >
          <Switch
            checked={form.githubIntegrationsEnabled ?? false}
            onChange={(v) => update({ githubIntegrationsEnabled: v })}
          />
        </Row>

        <Row
          title={t("settings.github.invalidateCache")}
          description={t("settings.github.invalidateCacheDesc")}
        >
          <button
            className="rs-btn"
            disabled={refresh.isPending}
            onClick={() => {
              refresh.mutate(undefined, {
                onSuccess: () => toast.success(t("settings.github.cacheCleared")),
              });
            }}
          >
            <RefreshCw
              size={13}
              className={refresh.isPending ? "animate-spin" : ""}
            />
            {t("settings.github.clearCache")}
          </button>
        </Row>
      </div>
    </section>
  );
}
