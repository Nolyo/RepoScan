import { ArrowDown, ArrowUp, Pencil, Unlink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useUiStore } from "../../stores/ui";

interface Props {
  counts?: {
    dirty: number;
    ahead: number;
    behind: number;
    noUpstream: number;
  };
}

export default function FilterBar({ counts }: Props) {
  const { filters, setFilter } = useUiStore();
  const { t } = useTranslation();

  const items = [
    { key: "dirty" as const, label: t("toolbar.filterDirty"), Icon: Pencil },
    { key: "ahead" as const, label: t("toolbar.filterAhead"), Icon: ArrowUp },
    { key: "behind" as const, label: t("toolbar.filterBehind"), Icon: ArrowDown },
    { key: "noUpstream" as const, label: t("toolbar.filterNoUpstream"), Icon: Unlink },
  ];

  return (
    <div className="flex items-center gap-1.5">
      {items.map(({ key, label, Icon }) => (
        <button
          key={key}
          type="button"
          className="rs-chip"
          data-active={filters[key] ? "true" : "false"}
          onClick={() => setFilter(key, !filters[key])}
        >
          <Icon size={11} />
          <span>{label}</span>
          {counts && <span className="rs-chip-count">{counts[key]}</span>}
        </button>
      ))}
    </div>
  );
}
