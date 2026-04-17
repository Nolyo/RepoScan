import { useCallback, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useUiStore } from "../../stores/ui";

export default function SearchBar() {
  const { searchQuery, setSearchQuery } = useUiStore();
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value),
    [setSearchQuery],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? "").toUpperCase();
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      } else if (e.key === "Escape" && document.activeElement === inputRef.current) {
        inputRef.current?.blur();
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSearchQuery]);

  return (
    <div className="rs-search">
      <Search className="rs-search-icon" />
      <input
        ref={inputRef}
        className="rs-search-input"
        placeholder={t("toolbar.searchPlaceholder")}
        value={searchQuery}
        onChange={handleChange}
      />
      {searchQuery ? (
        <button
          onClick={() => setSearchQuery("")}
          className="rs-search-clear"
          aria-label={t("toolbar.clearFilters")}
        >
          <X size={12} />
        </button>
      ) : (
        <div className="rs-search-kbd">
          <kbd className="rs-kbd">/</kbd>
        </div>
      )}
    </div>
  );
}
