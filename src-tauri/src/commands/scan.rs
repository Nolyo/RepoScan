use std::path::Path;

use crate::domain::types::{RepoInfo, ScanPreview};
use crate::services::scanner;

#[tauri::command]
#[specta::specta]
pub fn scan_repositories(
    root_path: String,
    max_depth: u8,
    show_empty_folders: bool,
) -> Vec<RepoInfo> {
    let path = Path::new(&root_path);
    if !path.exists() {
        return vec![];
    }
    scanner::scan(path, max_depth, show_empty_folders)
}

#[tauri::command]
#[specta::specta]
pub fn refresh_repo(path: String) -> Option<RepoInfo> {
    use crate::domain::types::RepoKind;
    let p = Path::new(&path);
    if !p.exists() {
        return None;
    }
    let git_marker = p.join(".git");
    if !git_marker.exists() {
        return None;
    }
    let kind = if git_marker.is_file() { RepoKind::Submodule } else { RepoKind::Git };
    // Use parent as root for relative path
    let root = p.parent().unwrap_or(p);
    Some(crate::services::git_info::analyze(p, root, 0, kind))
}

#[tauri::command]
#[specta::specta]
pub fn preview_scan(root_path: String, max_depth: u8) -> ScanPreview {
    let path = Path::new(&root_path);
    if !path.exists() {
        return ScanPreview { repos_count: 0, folders_count: 0, sample: vec![] };
    }
    let (repos, folders, sample) = scanner::preview_scan(path, max_depth);
    ScanPreview { repos_count: repos, folders_count: folders, sample }
}
