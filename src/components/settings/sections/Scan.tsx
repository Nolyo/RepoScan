import { ScanSearch } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { AppConfig } from "../../../bindings";
import { Row, SectionHero, Slider } from "../widgets";

export default function ScanSection({
  form,
  update,
}: {
  form: AppConfig;
  update: (patch: Partial<AppConfig>) => void;
}) {
  const { t } = useTranslation();
  return (
    <section id="rs-sect-scan" className="rs-section">
      <SectionHero
        eyebrow={
          <>
            <ScanSearch size={13} />
            {t("settings.nav.scan")}
          </>
        }
        title={t("settings.scan.heroTitle")}
        description={t("settings.scan.heroDesc")}
        illustration={
          <>
            <div
              className="rs-ill-blob"
              style={{
                width: 140,
                height: 140,
                background: "hsl(160 80% 50%)",
                top: -40,
                right: -30,
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                width={140}
                height={100}
                viewBox="0 0 140 100"
                fill="none"
                className="opacity-80"
              >
                <circle cx={70} cy={50} r={6} fill="hsl(var(--rs-accent))" />
                <circle cx={30} cy={25} r={4} fill="hsl(var(--rs-muted-fg))" />
                <circle cx={110} cy={25} r={4} fill="hsl(var(--rs-muted-fg))" />
                <circle cx={20} cy={75} r={3} fill="hsl(var(--rs-muted-fg))" />
                <circle cx={50} cy={80} r={3} fill="hsl(var(--rs-muted-fg))" />
                <circle cx={90} cy={80} r={3} fill="hsl(var(--rs-muted-fg))" />
                <circle cx={120} cy={75} r={3} fill="hsl(var(--rs-muted-fg))" />
                <line x1={70} y1={50} x2={30} y2={25} stroke="hsl(var(--rs-border))" />
                <line x1={70} y1={50} x2={110} y2={25} stroke="hsl(var(--rs-border))" />
                <line x1={30} y1={25} x2={20} y2={75} stroke="hsl(var(--rs-border))" />
                <line x1={30} y1={25} x2={50} y2={80} stroke="hsl(var(--rs-border))" />
                <line x1={110} y1={25} x2={90} y2={80} stroke="hsl(var(--rs-border))" />
                <line x1={110} y1={25} x2={120} y2={75} stroke="hsl(var(--rs-border))" />
              </svg>
            </div>
          </>
        }
      />

      <div className="rs-card">
        <Row
          title={t("settings.scan.depth")}
          description={t("settings.scan.depthDesc")}
        >
          <Slider
            min={1}
            max={6}
            value={form.maxScanDepth}
            onChange={(v) => update({ maxScanDepth: v })}
            label={t("settings.scan.levels")}
            ticks={[1, 2, 3, 4, 5, 6]}
          />
        </Row>

        <Row
          title={t("settings.scan.concurrency")}
          description={t("settings.scan.concurrencyDesc")}
        >
          <Slider
            min={1}
            max={16}
            value={form.fetchConcurrency}
            onChange={(v) => update({ fetchConcurrency: v })}
            label={t("settings.scan.parallel")}
          />
        </Row>

        <Row
          title={t("settings.scan.timeout")}
          description={t("settings.scan.timeoutDesc")}
        >
          <Slider
            min={5}
            max={120}
            step={5}
            value={form.fetchTimeoutSeconds}
            onChange={(v) => update({ fetchTimeoutSeconds: v })}
            label={t("settings.scan.delay")}
            suffix="s"
          />
        </Row>
      </div>
    </section>
  );
}
