use std::path::Path;

use git2::{Repository, StatusOptions};

use crate::domain::types::{
    AheadBehind, CommitInfo, RepoInfo, RepoKind, RepoStatus,
};

pub fn analyze(path: &Path, root: &Path, depth: u32, kind: RepoKind) -> RepoInfo {
    let name = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("")
        .to_string();
    let relative_path = path
        .strip_prefix(root)
        .unwrap_or(path)
        .to_string_lossy()
        .to_string();

    let repo = match Repository::open(path) {
        Ok(r) => r,
        Err(_) => {
            return RepoInfo {
                path: path.to_string_lossy().to_string(),
                relative_path,
                name,
                depth,
                kind,
                current_branch: None,
                last_commit: None,
                status: RepoStatus::clean(),
                ahead_behind: None,
                remote_url: None,
                remote_short: None,
                children: vec![],
            };
        }
    };

    let current_branch = get_branch(&repo);
    let last_commit = get_last_commit(&repo);
    let status = get_status(&repo);
    let ahead_behind = get_ahead_behind(&repo);
    let (remote_url, remote_short) = get_remote(&repo);

    RepoInfo {
        path: path.to_string_lossy().to_string(),
        relative_path,
        name,
        depth,
        kind,
        current_branch,
        last_commit,
        status,
        ahead_behind,
        remote_url,
        remote_short,
        children: vec![],
    }
}

fn get_branch(repo: &Repository) -> Option<String> {
    let head = repo.head().ok()?;
    if head.is_branch() {
        head.shorthand().map(|s| s.to_string())
    } else {
        // Detached HEAD — show short commit hash
        let oid = head.target()?;
        Some(format!("({})", &oid.to_string()[..7]))
    }
}

fn get_last_commit(repo: &Repository) -> Option<CommitInfo> {
    let head = repo.head().ok()?;
    let oid = head.target()?;
    let commit = repo.find_commit(oid).ok()?;

    let short_hash = oid.to_string()[..7].to_string();
    let subject = commit
        .summary()
        .unwrap_or("")
        .chars()
        .take(72)
        .collect::<String>();

    let time = commit.time();
    let secs = time.seconds();
    let date_iso = chrono_from_secs(secs);

    Some(CommitInfo { short_hash, subject, date_iso })
}

fn chrono_from_secs(secs: i64) -> String {
    // Format as YYYY-MM-DD using only std
    let secs_total = if secs >= 0 { secs as u64 } else { return "unknown".into() };
    // Simple date calculation (no external crate)
    let days = secs_total / 86400;
    let (y, m, d) = days_to_ymd(days);
    format!("{y:04}-{m:02}-{d:02}")
}

fn days_to_ymd(mut days: u64) -> (u64, u64, u64) {
    // Days since Unix epoch (1970-01-01)
    let mut year = 1970u64;
    loop {
        let leap = is_leap(year);
        let days_in_year = if leap { 366 } else { 365 };
        if days < days_in_year {
            break;
        }
        days -= days_in_year;
        year += 1;
    }
    let leap = is_leap(year);
    let month_days: [u64; 12] = [31, if leap { 29 } else { 28 }, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let mut month = 1u64;
    for md in month_days {
        if days < md {
            break;
        }
        days -= md;
        month += 1;
    }
    (year, month, days + 1)
}

fn is_leap(y: u64) -> bool {
    (y % 4 == 0 && y % 100 != 0) || (y % 400 == 0)
}

fn get_status(repo: &Repository) -> RepoStatus {
    let mut opts = StatusOptions::new();
    opts.include_untracked(true)
        .recurse_untracked_dirs(false)
        .include_ignored(false)
        .include_unmodified(false);

    let statuses = match repo.statuses(Some(&mut opts)) {
        Ok(s) => s,
        Err(_) => return RepoStatus::clean(),
    };

    let mut s = RepoStatus {
        clean: false,
        modified: 0,
        added: 0,
        deleted: 0,
        renamed: 0,
        untracked: 0,
        conflicted: 0,
        staged_modified: 0,
    };

    for entry in statuses.iter() {
        let flags = entry.status();

        if flags.contains(git2::Status::CONFLICTED) {
            s.conflicted += 1;
            continue;
        }
        if flags.contains(git2::Status::WT_NEW) {
            s.untracked += 1;
        }
        if flags.contains(git2::Status::WT_MODIFIED)
            || flags.contains(git2::Status::WT_TYPECHANGE)
        {
            s.modified += 1;
        }
        if flags.contains(git2::Status::WT_DELETED) {
            s.deleted += 1;
        }
        if flags.contains(git2::Status::WT_RENAMED) {
            s.renamed += 1;
        }
        if flags.contains(git2::Status::INDEX_NEW) {
            s.added += 1;
        }
        if flags.contains(git2::Status::INDEX_MODIFIED)
            || flags.contains(git2::Status::INDEX_TYPECHANGE)
        {
            s.staged_modified += 1;
        }
        if flags.contains(git2::Status::INDEX_DELETED) {
            s.deleted += 1;
        }
        if flags.contains(git2::Status::INDEX_RENAMED) {
            s.renamed += 1;
        }
    }

    s.clean = s.is_clean();
    s
}

fn get_ahead_behind(repo: &Repository) -> Option<AheadBehind> {
    let head = repo.head().ok()?;
    if !head.is_branch() {
        return Some(AheadBehind { ahead: 0, behind: 0, has_upstream: false });
    }

    let branch_name = head.shorthand()?;
    let branch = repo
        .find_branch(branch_name, git2::BranchType::Local)
        .ok()?;

    let upstream = match branch.upstream() {
        Ok(u) => u,
        Err(_) => return Some(AheadBehind { ahead: 0, behind: 0, has_upstream: false }),
    };

    let local_oid = head.target()?;
    let upstream_oid = upstream.get().target()?;

    let (ahead, behind) = repo.graph_ahead_behind(local_oid, upstream_oid).ok()?;

    Some(AheadBehind { ahead, behind, has_upstream: true })
}

fn get_remote(repo: &Repository) -> (Option<String>, Option<String>) {
    let remote = match repo.find_remote("origin") {
        Ok(r) => r,
        Err(_) => return (None, None),
    };

    let url = match remote.url() {
        Some(u) => u.to_string(),
        None => return (None, None),
    };

    let short = remote_short_name(&url);
    (Some(url), Some(short))
}

fn remote_short_name(url: &str) -> String {
    // Strip trailing .git
    let url = url.trim_end_matches(".git");
    // Get last two path/colon-separated segments
    let parts: Vec<&str> = url.splitn(2, ':').last()
        .unwrap_or(url)
        .trim_start_matches('/')
        .split('/')
        .filter(|s| !s.is_empty())
        .collect();

    if parts.len() >= 2 {
        format!("{}/{}", parts[parts.len() - 2], parts[parts.len() - 1])
    } else {
        parts.last().unwrap_or(&url).to_string()
    }
}
