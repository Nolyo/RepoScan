import { useTranslation } from "react-i18next";
import { useUiStore } from "../../stores/ui";
import { cn } from "../../lib/utils";

export default function FilterBar() {
  const { filters, setFilter, clearFilters } = useUiStore();
  const { t } = useTranslation();
  const hasActive = Object.values(filters).some(Boolean);

  const FILTERS = [
    { key: "dirty" as const, label: t("toolbar.filterDirty") },
    { key: "ahead" as const, label: t("toolbar.filterAhead") },
    { key: "behind" as const, label: t("toolbar.filterBehind") },
    { key: "noUpstream" as const, label: t("toolbar.filterNoUpstream") },
  ];

  return (
    <div className="flex items-center gap-1.5">
      {FILTERS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => setFilter(key, !filters[key])}
          className={cn(
            "h-7 px-2.5 text-xs rounded-md border transition-colors",
            filters[key]
              ? "bg-primary text-primary-foreground border-primary"
              : "border-input bg-background hover:bg-accent hover:text-accent-foreground text-muted-foreground",
          )}
        >
          {label}
        </button>
      ))}
      {hasActive && (
        <button
          onClick={clearFilters}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          {t("toolbar.clearFilters")}
        </button>
      )}
    </div>
  );
}
