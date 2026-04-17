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
import {
  ChevronRight,
  ChevronDown,
  GitBranch,
  Folder,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { RepoInfo, Editor, RepoIntegration } from "../../bindings";
import { useUiStore } from "../../stores/ui";
import { filterRepos } from "../../lib/repoUtils";
import { formatRelativeDate } from "../../lib/utils";
import { StatusBadge, SyncBadge } from "./StatusBadge";
import GithubBadges from "./GithubBadges";
import RepoContextMenu from "../context-menu/RepoContextMenu";
import { Tooltip } from "../ui/Tooltip";
import { commands } from "../../bindings";

interface Props {
  repos: RepoInfo[];
  editors: Editor[];
  githubEnabled?: boolean;
  integrationsByPath?: Record<string, RepoIntegration>;
  integrationsLoading?: boolean;
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

export default function RepoTable({
  repos,
  editors,
  githubEnabled = false,
  integrationsByPath,
  integrationsLoading = false,
}: Props) {
  const { searchQuery, filters, expandedPaths, toggleExpanded } = useUiStore();
  const [sorting, setSorting] = useState<SortingState>([]);
  const { t } = useTranslation();

  const visibleRepos = useMemo(() => {
    if (searchQuery || Object.values(filters).some(Boolean)) {
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
        header: t("table.colRepo"),
        size: 30,
        cell: ({ row }) => {
          const repo = row.original;
          const isFolder = repo.kind === "parentFolder";
          const isExpanded = expandedPaths.has(repo.path);
          const hasChildren = repo.children.length > 0;

          return (
            <div
              className="rs-repo-name"
              style={{ paddingLeft: `${repo.depth * 16}px` }}
            >
              {isFolder && hasChildren ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpanded(repo.path);
                  }}
                  className="rs-chev"
                  aria-label={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                </button>
              ) : (
                <span style={{ width: 14, display: "inline-block" }} />
              )}
              {isFolder ? (
                <Folder size={14} className="shrink-0" style={{ color: "hsl(var(--rs-muted-fg))" }} />
              ) : (
                <GitBranch size={14} className="shrink-0" style={{ color: "hsl(var(--rs-muted-fg))" }} />
              )}
              <span
                className="truncate"
                style={{
                  maxWidth: 360,
                  fontWeight: isFolder ? 500 : 400,
                  color: isFolder
                    ? "hsl(var(--rs-muted-fg))"
                    : "hsl(var(--rs-fg))",
                }}
              >
                {repo.name}
              </span>
              {repo.kind === "submodule" && (
                <span className="rs-sub-tag">sub</span>
              )}
            </div>
          );
        },
      },
      {
        id: "currentBranch",
        accessorKey: "currentBranch",
        header: t("table.colBranch"),
        size: 10,
        cell: ({ row }) => {
          const branch = row.original.currentBranch;
          if (!branch) return null;
          return (
            <span className="rs-branch" title={branch}>
              <GitBranch size={11} />
              <span className="truncate">{branch}</span>
            </span>
          );
        },
      },
      {
        id: "status",
        header: t("table.colStatus"),
        size: 4,
        cell: ({ row }) => {
          const repo = row.original;
          if (repo.kind === "parentFolder") return null;
          return <StatusBadge status={repo.status} />;
        },
      },
      {
        id: "lastCommit",
        header: t("table.colLastCommit"),
        size: 36,
        cell: ({ row }) => {
          const commit = row.original.lastCommit;
          if (!commit) return null;
          return (
            <Tooltip
              content={
                <div className="rs-tooltip-commit">
                  <span className="rs-mono rs-tooltip-hash">{commit.shortHash}</span>
                  <span className="rs-tooltip-subject">{commit.subject}</span>
                </div>
              }
              side="top"
              align="start"
            >
              <span className="truncate block" style={{ maxWidth: "100%" }}>
                <span
                  className="rs-mono"
                  style={{ color: "hsl(var(--rs-fg))" }}
                >
                  {commit.shortHash}
                </span>
                <span className="rs-muted" style={{ marginLeft: 8 }}>
                  {commit.subject}
                </span>
              </span>
            </Tooltip>
          );
        },
      },
      {
        id: "date",
        header: t("table.colDate"),
        size: 7,
        accessorFn: (row) => row.lastCommit?.dateIso ?? "",
        cell: ({ row }) => {
          const date = row.original.lastCommit?.dateIso;
          if (!date) return null;
          return (
            <span className="rs-muted" title={date}>
              {formatRelativeDate(date)}
            </span>
          );
        },
      },
      {
        id: "aheadBehind",
        header: t("table.colSync"),
        size: 5,
        cell: ({ row }) => {
          const repo = row.original;
          if (repo.kind === "parentFolder") return null;
          return <SyncBadge ab={repo.aheadBehind} />;
        },
      },
      ...(githubEnabled
        ? [
            {
              id: "github",
              header: t("table.colGithub"),
              size: 8,
              cell: ({ row }) => {
                const repo = row.original;
                if (repo.kind === "parentFolder") return null;
                return (
                  <GithubBadges
                    integration={integrationsByPath?.[repo.path]}
                    loading={integrationsLoading}
                  />
                );
              },
            } satisfies ColumnDef<RepoInfo>,
          ]
        : []),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [expandedPaths, toggleExpanded, githubEnabled, integrationsByPath, integrationsLoading, t],
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
    <div className="rs-tbl-wrap flex-1">
      <table className="rs-tbl">
        <colgroup>
          {table.getAllColumns().map((col) => (
            <col key={col.id} style={{ width: `${col.getSize()}%` }} />
          ))}
        </colgroup>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const sorted = header.column.getIsSorted();
                return (
                  <th
                    key={header.id}
                    className="sortable"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <span className="sort-wrap">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <span className="sort-ind">
                        {sorted === "asc" ? (
                          <svg viewBox="0 0 10 10" width="10" height="10" fill="currentColor">
                            <path d="M5 2 L9 7 L1 7 Z" />
                          </svg>
                        ) : sorted === "desc" ? (
                          <svg viewBox="0 0 10 10" width="10" height="10" fill="currentColor">
                            <path d="M5 8 L9 3 L1 3 Z" />
                          </svg>
                        ) : null}
                      </span>
                    </span>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => {
            const repo = row.original;
            const isFolder = repo.kind === "parentFolder";
            return (
              <RepoContextMenu key={repo.path} repo={repo} editors={editors}>
                <tr
                  className={isFolder ? "folder-row" : undefined}
                  onDoubleClick={() => {
                    if (isFolder) toggleExpanded(repo.path);
                    else commands.openInExplorer(repo.path);
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              </RepoContextMenu>
            );
          })}
        </tbody>
      </table>
      {visibleRepos.length === 0 && (
        <div className="flex justify-center py-8 rs-muted text-sm">
          {t("app.noRepos")}
        </div>
      )}
    </div>
  );
}

function getAllPaths(repo: RepoInfo): string[] {
  return [repo.path, ...repo.children.flatMap(getAllPaths)];
}
