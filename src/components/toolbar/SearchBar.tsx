import { useCallback } from "react";
import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useUiStore } from "../../stores/ui";

export default function SearchBar() {
  const { searchQuery, setSearchQuery } = useUiStore();
  const { t } = useTranslation();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value),
    [setSearchQuery],
  );

  return (
    <div className="relative flex-1 max-w-xs">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
      <input
        className="w-full h-8 rounded-md border border-input bg-background pl-8 pr-7 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        placeholder={t("toolbar.searchPlaceholder")}
        value={searchQuery}
        onChange={handleChange}
      />
      {searchQuery && (
        <button
          onClick={() => setSearchQuery("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
