import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ChevronRight, ChevronDown, GitBranch, Folder } from "lucide-react";
import type { RepoInfo, Editor } from "../../bindings";
import { useUiStore } from "../../stores/ui";
import { filterRepos } from "../../lib/repoUtils";
import { formatRelativeDate } from "../../lib/utils";
import { StatusBadge, SyncBadge } from "./StatusBadge";
import RepoContextMenu from "../context-menu/RepoContextMenu";
import { cn } from "../../lib/utils";
import { commands } from "../../bindings";

interface Props {
  repos: RepoInfo[];
  editors: Editor[];
}

function flattenWithState(
  repos: RepoInfo[],
  expandedPaths: Set<string>,
  depth = 0,
): RepoInfo[] {
  const result: RepoInfo[] = [];
  for (const repo of repos) {
    result.push(repo);
    if (repo.children.length > 0 && expandedPaths.has(repo.path)) {
      result.push(...flattenWithState(repo.children, expandedPaths, depth + 1));
    }
  }
  return result;
}

export default function RepoTable({ repos, editors }: Props) {
  const { searchQuery, filters, expandedPaths, toggleExpanded } = useUiStore();
  const [sorting, setSorting] = useState<SortingState>([]);

  const visibleRepos = useMemo(() => {
    if (searchQuery || Object.values(filters).some(Boolean)) {
      // When filtering, show flat list of matched repos only
      const allFlat = flattenWithState(repos, new Set(repos.flatMap(getAllPaths)));
      return filterRepos(allFlat, searchQuery, filters);
    }
    return flattenWithState(repos, expandedPaths);
  }, [repos, expandedPaths, searchQuery, filters]);

  const columns = useMemo<ColumnDef<RepoInfo>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: "Dépôt",
        size: 280,
        cell: ({ row }) => {
          const repo = row.original;
          const isFolder = repo.kind === "parentFolder";
          const isExpanded = expandedPaths.has(repo.path);
          const hasChildren = repo.children.length > 0;

          return (
            <div
              className="flex items-center gap-1.5 min-w-0"
              style={{ paddingLeft: `${repo.depth * 16}px` }}
            >
              {isFolder && hasChildren ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpanded(repo.path);
                  }}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </button>
              ) : (
                <span className="w-3.5 shrink-0" />
              )}
              {isFolder ? (
                <Folder className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              ) : (
                <GitBranch className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
              <span
                className={cn(
                  "truncate text-sm",
                  isFolder && "font-medium text-muted-foreground",
                )}
              >
                {repo.name}
              </span>
              {repo.kind === "submodule" && (
                <span className="text-xs text-muted-foreground bg-muted rounded px-1">sub</span>
              )}
            </div>
          );
        },
      },
      {
        id: "currentBranch",
        accessorKey: "currentBranch",
        header: "Branche",
        size: 140,
        cell: ({ row }) => {
          const branch = row.original.currentBranch;
          if (!branch) return null;
          return (
            <span className="text-xs font-mono text-muted-foreground truncate block max-w-[130px]">
              {branch}
            </span>
          );
        },
      },
      {
        id: "status",
        header: "Statut",
        size: 130,
        cell: ({ row }) => {
          const repo = row.original;
          if (repo.kind === "parentFolder") return null;
          return <StatusBadge status={repo.status} />;
        },
      },
      {
        id: "lastCommit",
        header: "Dernier commit",
        size: 260,
        cell: ({ row }) => {
          const commit = row.original.lastCommit;
          if (!commit) return null;
          return (
            <span className="text-xs font-mono text-muted-foreground truncate block max-w-[250px]">
              <span className="text-foreground">{commit.shortHash}</span>{" "}
              {commit.subject}
            </span>
          );
        },
      },
      {
        id: "date",
        header: "Date",
        size: 90,
        accessorFn: (row) => row.lastCommit?.dateIso ?? "",
        cell: ({ row }) => {
          const date = row.original.lastCommit?.dateIso;
          if (!date) return null;
          return (
            <span className="text-xs text-muted-foreground" title={date}>
              {formatRelativeDate(date)}
            </span>
          );
        },
      },
      {
        id: "aheadBehind",
        header: "Sync",
        size: 80,
        cell: ({ row }) => {
          const repo = row.original;
          if (repo.kind === "parentFolder") return null;
          return <SyncBadge ab={repo.aheadBehind} />;
        },
      },
      {
        id: "remoteShort",
        accessorKey: "remoteShort",
        header: "Remote",
        size: 160,
        cell: ({ row }) => {
          const remote = row.original.remoteShort;
          if (!remote) return null;
          return (
            <span className="text-xs text-muted-foreground font-mono truncate block max-w-[150px]">
              {remote}
            </span>
          );
        },
      },
    ],
    [expandedPaths, toggleExpanded],
  );

  const table = useReactTable({
    data: visibleRepos,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="overflow-auto flex-1">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10 bg-background border-b">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="text-left px-3 py-2 text-xs font-medium text-muted-foreground whitespace-nowrap select-none"
                    style={{ width: header.column.getSize() }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1 cursor-pointer hover:text-foreground">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === "asc" && " ↑"}
                      {header.column.getIsSorted() === "desc" && " ↓"}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <RepoContextMenu
                key={row.original.path}
                repo={row.original}
                editors={editors}
              >
                <tr
                  className={cn(
                    "border-b border-border/50 hover:bg-muted/30 transition-colors cursor-default select-none",
                    row.original.kind === "parentFolder" && "bg-muted/10",
                  )}
                  onDoubleClick={() => {
                    if (row.original.kind !== "parentFolder") {
                      commands.openInExplorer(row.original.path);
                    } else {
                      toggleExpanded(row.original.path);
                    }
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-3 py-1.5 overflow-hidden"
                      style={{ maxWidth: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              </RepoContextMenu>
            ))}
          </tbody>
        </table>
        {visibleRepos.length === 0 && (
          <div className="flex justify-center py-8 text-sm text-muted-foreground">
            Aucun dépôt ne correspond aux filtres.
          </div>
        )}
      </div>
    </div>
  );
}

function getAllPaths(repo: RepoInfo): string[] {
  return [repo.path, ...repo.children.flatMap(getAllPaths)];
}
