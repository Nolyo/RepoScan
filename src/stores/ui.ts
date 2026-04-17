import { create } from "zustand";

interface Filters {
  dirty: boolean;
  ahead: boolean;
  behind: boolean;
  noUpstream: boolean;
  errors: boolean;
}

interface UiState {
  searchQuery: string;
  filters: Filters;
  expandedPaths: Set<string>;
  selectedPaths: string[];
  isFetchSheetOpen: boolean;

  setSearchQuery: (q: string) => void;
  setFilter: (key: keyof Filters, value: boolean) => void;
  toggleExpanded: (path: string) => void;
  setExpanded: (path: string, expanded: boolean) => void;
  setSelectedPaths: (paths: string[]) => void;
  toggleFetchSheet: () => void;
  setFetchSheetOpen: (open: boolean) => void;
  clearFilters: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  searchQuery: "",
  filters: {
    dirty: false,
    ahead: false,
    behind: false,
    noUpstream: false,
    errors: false,
  },
  expandedPaths: new Set(),
  selectedPaths: [],
  isFetchSheetOpen: false,

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),
  toggleExpanded: (path) =>
    set((state) => {
      const next = new Set(state.expandedPaths);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return { expandedPaths: next };
    }),
  setExpanded: (path, expanded) =>
    set((state) => {
      const next = new Set(state.expandedPaths);
      if (expanded) next.add(path);
      else next.delete(path);
      return { expandedPaths: next };
    }),
  setSelectedPaths: (selectedPaths) => set({ selectedPaths }),
  toggleFetchSheet: () => set((state) => ({ isFetchSheetOpen: !state.isFetchSheetOpen })),
  setFetchSheetOpen: (isFetchSheetOpen) => set({ isFetchSheetOpen }),
  clearFilters: () =>
    set({
      searchQuery: "",
      filters: { dirty: false, ahead: false, behind: false, noUpstream: false, errors: false },
    }),
}));
