import { BookOpen, Bug, ExternalLink, FolderGit2, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import type { AppConfig } from "../../../bindings";
import { commands } from "../../../bindings";
import { useAppVersion } from "../../../hooks/useUpdater";
import { GithubMark, SectionHero } from "../widgets";

export default function AboutSection({ form }: { form: AppConfig }) {
  const { t } = useTranslation();
  const { data: appVersion } = useAppVersion();
  const { data: platform } = useQuery({
    queryKey: ["platform"],
    queryFn: commands.platformInfo,
    staleTime: Infinity,
  });

  const channelLabel =
    form.updateChannel === "beta"
      ? t("settings.updates.beta")
      : t("settings.updates.stable");

  const links = [
    {
      title: t("settings.about.source"),
      desc: "github.com/nolyo/reposcan",
      href: "https://github.com/nolyo/reposcan",
      icon: <GithubMark size={14} />,
    },
    {
      title: t("settings.about.reportBug"),
      desc: t("settings.about.reportBugDesc"),
      href: "https://github.com/nolyo/reposcan/issues/new",
      icon: <Bug size={14} />,
    },
    {
      title: t("settings.about.docs"),
      desc: t("settings.about.docsDesc"),
      href: "https://github.com/nolyo/reposcan#readme",
      icon: <BookOpen size={14} />,
    },
  ];

  return (
    <section id="rs-sect-about" className="rs-section">
      <SectionHero
        eyebrow={
          <>
            <Info size={13} />
            {t("settings.nav.about")}
          </>
        }
        title="RepoScan"
        description={t("settings.about.heroDesc")}
        illustration={
          <>
            <div
              className="rs-ill-blob"
              style={{
                width: 120,
                height: 120,
                background: "hsl(var(--rs-accent))",
                top: 0,
                right: 0,
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(var(--rs-accent)), hsl(210 100% 40%))",
                }}
              >
                <FolderGit2 size={32} className="text-white" />
              </div>
            </div>
          </>
        }
      />

      <div className="rs-card">
        <div className="grid grid-cols-2 gap-0">
          <InfoCell
            label={t("settings.about.version")}
            value={<span className="font-mono">{appVersion ?? "…"}</span>}
            border="rb"
          />
          <InfoCell
            label={t("settings.about.channel")}
            value={channelLabel}
            border="b"
          />
          <InfoCell
            label={t("settings.about.platform")}
            value={
              <span className="font-mono">
                {platform
                  ? `${platform.os}${platform.isWsl ? " · WSL" : ""}`
                  : "…"}
              </span>
            }
            border="r"
          />
          <InfoCell
            label={t("settings.about.tauri")}
            value={<span className="font-mono">2.x</span>}
          />
        </div>
      </div>

      <div className="rs-card mt-4">
        {links.map((link, i) => (
          <a
            key={i}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="rs-row hover:bg-white/[.02] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "hsl(var(--rs-muted))" }}
              >
                {link.icon}
              </div>
              <div>
                <div className="text-[13.5px] font-semibold">{link.title}</div>
                <div
                  className="text-[12px]"
                  style={{ color: "hsl(var(--rs-muted-fg))" }}
                >
                  {link.desc}
                </div>
              </div>
            </div>
            <ExternalLink
              size={14}
              style={{ color: "hsl(var(--rs-muted-fg))" }}
            />
          </a>
        ))}
      </div>

      <div
        className="text-center mt-8 pb-4 text-[11.5px]"
        style={{ color: "hsl(var(--rs-muted-fg))" }}
      >
        {t("settings.about.madeWith")}{" "}
        <span style={{ color: "hsl(var(--rs-danger))" }}>♥</span>{" "}
        {t("settings.about.by")}{" "}
        <span
          className="font-semibold"
          style={{ color: "hsl(var(--rs-fg))" }}
        >
          @nolyo
        </span>{" "}
        · {t("settings.about.license")}
      </div>
    </section>
  );
}

function InfoCell({
  label,
  value,
  border,
}: {
  label: string;
  value: React.ReactNode;
  border?: "r" | "b" | "rb";
}) {
  const style: React.CSSProperties = { borderColor: "hsl(var(--rs-border))" };
  const cls = ["p-5"];
  if (border?.includes("r")) cls.push("border-r");
  if (border?.includes("b")) cls.push("border-b");
  return (
    <div className={cls.join(" ")} style={style}>
      <div
        className="text-[11px] uppercase tracking-[.08em] font-semibold mb-1"
        style={{ color: "hsl(var(--rs-muted-fg))" }}
      >
        {label}
      </div>
      <div className="text-[15px] font-semibold">{value}</div>
    </div>
  );
}
