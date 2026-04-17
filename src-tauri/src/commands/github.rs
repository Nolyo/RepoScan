use std::path::{Path, PathBuf};

use tauri::{AppHandle, Emitter};

use crate::domain::types::{
    ClonePhase, CloneOutcome, CloneProgress, DepManager, GhAuthStatus, GithubRepoResult,
};
use crate::services::github;

#[tauri::command]
#[specta::specta]
pub async fn check_gh_auth() -> GhAuthStatus {
    github::check_auth().await
}

#[tauri::command]
#[specta::specta]
pub async fn search_github_repos(
    query: String,
    owner: Option<String>,
    limit: u32,
) -> Result<Vec<GithubRepoResult>, String> {
    let limit = limit.clamp(1, 100);
    github::search(&query, owner.as_deref(), limit)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn clone_github_repo(
    app: AppHandle,
    full_name: String,
    dest_parent: String,
) -> Result<CloneOutcome, String> {
    emit_progress(&app, &full_name, ClonePhase::Cloning, None);

    let parent = Path::new(&dest_parent);
    let clone_path: PathBuf = github::clone(&full_name, parent).await.map_err(|e| {
        let msg = e.to_string();
        emit_progress(&app, &full_name, ClonePhase::Error, Some(msg.clone()));
        msg
    })?;

    let dep_manager = github::detect_dep_manager(&clone_path);

    let outcome = CloneOutcome {
        clone_path: clone_path.to_string_lossy().to_string(),
        dep_manager,
    };

    emit_progress(&app, &full_name, ClonePhase::Cloned, None);
    Ok(outcome)
}

#[tauri::command]
#[specta::specta]
pub async fn install_repo_deps(
    app: AppHandle,
    repo_path: String,
    manager: DepManager,
) -> Result<(), String> {
    let full_name = Path::new(&repo_path)
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| repo_path.clone());

    emit_progress(&app, &full_name, ClonePhase::Installing, None);

    let app_cb = app.clone();
    let full_name_cb = full_name.clone();
    let result = github::install_deps(Path::new(&repo_path), manager, move |line| {
        let _ = app_cb.emit(
            "clone_progress",
            &CloneProgress {
                full_name: full_name_cb.clone(),
                phase: ClonePhase::Installing,
                message: Some(line),
            },
        );
    })
    .await;

    match result {
        Ok(()) => {
            emit_progress(&app, &full_name, ClonePhase::Installed, None);
            Ok(())
        }
        Err(e) => {
            let msg = e.to_string();
            emit_progress(&app, &full_name, ClonePhase::Error, Some(msg.clone()));
            Err(msg)
        }
    }
}

fn emit_progress(app: &AppHandle, full_name: &str, phase: ClonePhase, message: Option<String>) {
    let _ = app.emit(
        "clone_progress",
        &CloneProgress {
            full_name: full_name.to_string(),
            phase,
            message,
        },
    );
}
