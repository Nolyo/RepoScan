import type { RepoInfo, RepoStatus } from "../bindings";

/** Flatten a tree of RepoInfo to a flat list */
export function flattenRepos(repos: RepoInfo[]): RepoInfo[] {
  const result: RepoInfo[] = [];
  for (const repo of repos) {
    result.push(repo);
    if (repo.children.length > 0) {
      result.push(...flattenRepos(repo.children));
    }
  }
  return result;
}

/** Get a human-readable status summary */
export function statusSummary(status: RepoStatus): string {
  if (status.clean) return "Clean";
  const parts: string[] = [];
  if (status.modified > 0) parts.push(`M:${status.modified}`);
  if (status.added > 0) parts.push(`A:${status.added}`);
  if (status.deleted > 0) parts.push(`D:${status.deleted}`);
  if (status.renamed > 0) parts.push(`R:${status.renamed}`);
  if (status.untracked > 0) parts.push(`?:${status.untracked}`);
  if (status.conflicted > 0) parts.push(`!:${status.conflicted}`);
  if (status.stagedModified > 0) parts.push(`S:${status.stagedModified}`);
  return parts.join(" ");
}

/** Apply search + filters to a flat list of repos */
export function filterRepos(
  repos: RepoInfo[],
  searchQuery: string,
  filters: {
    dirty: boolean;
    ahead: boolean;
    behind: boolean;
    noUpstream: boolean;
    errors: boolean;
  },
): RepoInfo[] {
  let result = repos;

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    result = result.filter(
      (r) =>
        r.relativePath.toLowerCase().includes(q) ||
        (r.currentBranch?.toLowerCase().includes(q) ?? false) ||
        (r.lastCommit?.subject.toLowerCase().includes(q) ?? false) ||
        (r.remoteShort?.toLowerCase().includes(q) ?? false),
    );
  }

  if (filters.dirty) {
    result = result.filter((r) => r.kind !== "parentFolder" && !r.status.clean);
  }
  if (filters.ahead) {
    result = result.filter(
      (r) => r.kind !== "parentFolder" && (r.aheadBehind?.ahead ?? 0) > 0,
    );
  }
  if (filters.behind) {
    result = result.filter(
      (r) => r.kind !== "parentFolder" && (r.aheadBehind?.behind ?? 0) > 0,
    );
  }
  if (filters.noUpstream) {
    result = result.filter(
      (r) => r.kind !== "parentFolder" && r.aheadBehind !== null && !r.aheadBehind.hasUpstream,
    );
  }

  return result;
}
