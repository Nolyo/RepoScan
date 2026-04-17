use std::path::{Path, PathBuf};

use crate::domain::types::{RepoInfo, RepoKind, RepoStatus};
use crate::services::git_info;

/// Scan `root` recursively up to `max_depth`, returning a forest of RepoInfo nodes.
/// Parent folders containing repos are represented as ParentFolder nodes with children.
pub fn scan(
    root: &Path,
    max_depth: u8,
    show_empty_folders: bool,
) -> Vec<RepoInfo> {
    let mut results = Vec::new();
    scan_dir(root, root, 0, max_depth, show_empty_folders, &mut results);
    results
}

fn scan_dir(
    root: &Path,
    current: &Path,
    depth: u32,
    max_depth: u8,
    show_empty_folders: bool,
    results: &mut Vec<RepoInfo>,
) {
    if depth > max_depth as u32 {
        return;
    }

    let entries = match std::fs::read_dir(current) {
        Ok(e) => e,
        Err(_) => return,
    };

    let mut dirs: Vec<PathBuf> = Vec::new();

    for entry in entries.flatten() {
        let path = entry.path();
        let name = match path.file_name().and_then(|n| n.to_str()) {
            Some(n) => n.to_string(),
            None => continue,
        };

        // Skip hidden directories
        if name.starts_with('.') {
            continue;
        }

        if !path.is_dir() {
            continue;
        }

        // Check if it's a git repo
        let git_marker = path.join(".git");
        if git_marker.exists() {
            let kind = classify_git_marker(&git_marker);
            let info = git_info::analyze(&path, root, depth, kind);
            results.push(info);
        } else {
            dirs.push(path);
        }
    }

    // Recurse into non-repo dirs
    for dir in dirs {
        let name = dir
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("")
            .to_string();
        let relative_path = dir
            .strip_prefix(root)
            .unwrap_or(&dir)
            .to_string_lossy()
            .to_string();

        let mut children: Vec<RepoInfo> = Vec::new();
        if (depth + 1) <= max_depth as u32 {
            scan_dir(root, &dir, depth + 1, max_depth, show_empty_folders, &mut children);
        }

        if !children.is_empty() || (show_empty_folders && depth == 0) {
            results.push(RepoInfo {
                path: dir.to_string_lossy().to_string(),
                relative_path,
                name,
                depth,
                kind: RepoKind::ParentFolder,
                current_branch: None,
                last_commit: None,
                status: RepoStatus::clean(),
                ahead_behind: None,
                remote_url: None,
                remote_short: None,
                children,
            });
        }
    }

    // Sort: Git repos first, then parent folders, both alphabetically
    results.sort_by(|a, b| {
        let a_is_repo = a.kind != RepoKind::ParentFolder;
        let b_is_repo = b.kind != RepoKind::ParentFolder;
        match (a_is_repo, b_is_repo) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });
}

fn classify_git_marker(git_path: &Path) -> RepoKind {
    if git_path.is_file() {
        // .git is a file → submodule or worktree
        RepoKind::Submodule
    } else {
        RepoKind::Git
    }
}

/// Quick scan that only counts repos and folders (for onboarding preview)
pub fn preview_scan(root: &Path, max_depth: u8) -> (usize, usize, Vec<String>) {
    let mut repos = 0usize;
    let mut folders = 0usize;
    let mut sample: Vec<String> = Vec::new();

    preview_dir(root, root, 0, max_depth, &mut repos, &mut folders, &mut sample);
    (repos, folders, sample)
}

fn preview_dir(
    root: &Path,
    current: &Path,
    depth: u32,
    max_depth: u8,
    repos: &mut usize,
    folders: &mut usize,
    sample: &mut Vec<String>,
) {
    if depth > max_depth as u32 {
        return;
    }

    let entries = match std::fs::read_dir(current) {
        Ok(e) => e,
        Err(_) => return,
    };

    let mut dirs: Vec<PathBuf> = Vec::new();

    for entry in entries.flatten() {
        let path = entry.path();
        let name = match path.file_name().and_then(|n| n.to_str()) {
            Some(n) => n.to_string(),
            None => continue,
        };
        if name.starts_with('.') || !path.is_dir() {
            continue;
        }
        if path.join(".git").exists() {
            *repos += 1;
            if sample.len() < 5 {
                let rel = path
                    .strip_prefix(root)
                    .unwrap_or(&path)
                    .to_string_lossy()
                    .to_string();
                sample.push(rel);
            }
        } else {
            dirs.push(path);
            *folders += 1;
        }
    }

    for dir in dirs {
        preview_dir(root, &dir, depth + 1, max_depth, repos, folders, sample);
    }
}
