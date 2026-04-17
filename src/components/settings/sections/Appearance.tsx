import { Moon, Monitor, Palette, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSettingsStore, type Accent, type Density } from "../../../stores/settings";
import { Row, SectionHero, SegmentedControl, Switch } from "../widgets";

type Theme = "system" | "light" | "dark";

const ACCENT_COLORS: { value: Accent; color: string }[] = [
  { value: "blue", color: "hsl(210 100% 60%)" },
  { value: "green", color: "hsl(160 80% 45%)" },
  { value: "purple", color: "hsl(280 70% 60%)" },
  { value: "orange", color: "hsl(20 90% 60%)" },
  { value: "red", color: "hsl(0 70% 55%)" },
];

export default function AppearanceSection() {
  const { t } = useTranslation();
  const {
    theme,
    setTheme,
    accent,
    setAccent,
    density,
    setDensity,
    animations,
    setAnimations,
  } = useSettingsStore();

  const densityOptions = [
    { value: "compact" as Density, label: t("settings.appearance.densityCompact") },
    { value: "comfortable" as Density, label: t("settings.appearance.densityComfortable") },
    { value: "spacious" as Density, label: t("settings.appearance.densitySpacious") },
  ];

  return (
    <section id="rs-sect-appearance" className="rs-section">
      <SectionHero
        eyebrow={
          <>
            <Palette size={13} />
            {t("settings.nav.appearance")}
          </>
        }
        title={t("settings.appearance.heroTitle")}
        description={t("settings.appearance.heroDesc")}
        illustration={
          <>
            <div className="absolute inset-0 grid grid-cols-3">
              <div style={{ background: "#fff" }} />
              <div style={{ background: "hsl(var(--rs-card))" }} />
              <div style={{ background: "hsl(var(--rs-bg))" }} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-16 h-16 rounded-full border-[3px] border-white/80 shadow-lg"
                style={{
                  background:
                    "conic-gradient(from 0deg, #f43f5e, #f59e0b, #10b981, #3b82f6, #8b5cf6, #f43f5e)",
                }}
              />
            </div>
          </>
        }
      />

      <div className="rs-card">
        {/* Theme picker */}
        <div
          className="p-5 border-b"
          style={{ borderColor: "hsl(var(--rs-border))" }}
        >
          <div className="text-[13.5px] font-semibold">
            {t("settings.appearance.theme")}
          </div>
          <div
            className="text-[12.5px] mt-0.5 mb-4"
            style={{ color: "hsl(var(--rs-muted-fg))" }}
          >
            {t("settings.appearance.themeDesc")}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <ThemeTile
              theme="system"
              active={theme === "system"}
              onClick={() => setTheme("system")}
              label={t("settings.appearance.themeSystem")}
              icon={<Monitor size={13} />}
              background="linear-gradient(135deg, #fff 0%, #fff 50%, hsl(var(--rs-bg)) 50%, hsl(var(--rs-bg)) 100%)"
            />
            <ThemeTile
              theme="light"
              active={theme === "light"}
              onClick={() => setTheme("light")}
              label={t("settings.appearance.themeLight")}
              icon={<Sun size={13} />}
              background="#f4f4f5"
              innerLines="light"
            />
            <ThemeTile
              theme="dark"
              active={theme === "dark"}
              onClick={() => setTheme("dark")}
              label={t("settings.appearance.themeDark")}
              icon={<Moon size={13} />}
              background="hsl(var(--rs-bg))"
              innerLines="dark"
            />
          </div>
        </div>

        <Row
          title={t("settings.appearance.density")}
          description={t("settings.appearance.densityDesc")}
        >
          <SegmentedControl<Density>
            options={densityOptions}
            value={density}
            onChange={(v) => setDensity(v)}
          />
        </Row>

        <Row
          title={t("settings.appearance.accent")}
          description={t("settings.appearance.accentDesc")}
        >
          <div className="flex gap-2">
            {ACCENT_COLORS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className="rs-accent-swatch"
                data-active={accent === opt.value}
                style={{ background: opt.color }}
                onClick={() => setAccent(opt.value)}
                aria-label={opt.value}
              />
            ))}
          </div>
        </Row>

        <Row
          title={t("settings.appearance.animations")}
          description={t("settings.appearance.animationsDesc")}
        >
          <Switch checked={animations} onChange={setAnimations} />
        </Row>
      </div>
    </section>
  );
}

function ThemeTile({
  active,
  onClick,
  label,
  icon,
  background,
  innerLines,
}: {
  theme: Theme;
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  background: string;
  innerLines?: "light" | "dark";
}) {
  return (
    <button
      type="button"
      className="rs-theme-tile"
      data-active={active}
      onClick={onClick}
    >
      <div className="rs-theme-preview" style={{ background }}>
        {innerLines && (
          <div
            className="rs-theme-preview-content"
            style={
              innerLines === "light"
                ? { background: "#fff", borderColor: "#e4e4e7" }
                : { background: "hsl(var(--rs-card))", borderColor: "hsl(var(--rs-border))" }
            }
          >
            <div
              className="h-1 rounded mb-1"
              style={{
                width: "75%",
                background: innerLines === "light" ? "#e4e4e7" : "hsl(var(--rs-border))",
              }}
            />
            <div
              className="h-1 rounded mb-1"
              style={{
                width: "50%",
                background: innerLines === "light" ? "#e4e4e7" : "hsl(var(--rs-border))",
              }}
            />
            <div
              className="h-1 rounded"
              style={{
                width: "66%",
                background: innerLines === "light" ? "#e4e4e7" : "hsl(var(--rs-border))",
              }}
            />
          </div>
        )}
      </div>
      <div className="rs-theme-label">
        {icon}
        {label}
      </div>
    </button>
  );
}
