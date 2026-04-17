use std::path::{Path, PathBuf};
use std::time::Duration;

use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::{AppHandle, Emitter, State};

use crate::domain::types::{
    ClonePhase, CloneOutcome, CloneProgress, DepManager, GhAuthStatus, GithubRepoResult,
    RepoIntegration,
};
use crate::services::github_cache::DEFAULT_TTL_SECS;
use crate::services::github_integrations::{
    self, parse_github_remote, RepoRef,
};
use crate::services::github;
use crate::AppState;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct IntegrationRequest {
    pub path: String,
    pub remote_url: Option<String>,
    pub current_branch: Option<String>,
}

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

#[tauri::command]
#[specta::specta]
pub async fn get_repo_integrations(
    state: State<'_, AppState>,
    requests: Vec<IntegrationRequest>,
    force_refresh: bool,
) -> Result<Vec<RepoIntegration>, String> {
    let cache = state.github_cache.clone();
    let ttl = Duration::from_secs(DEFAULT_TTL_SECS);

    if force_refresh {
        cache.invalidate_all().await;
    }

    let mut cached: Vec<RepoIntegration> = Vec::new();
    let mut to_fetch: Vec<RepoRef> = Vec::new();

    for req in requests {
        let Some(remote) = req.remote_url.as_deref() else {
            continue;
        };
        let Some((owner, name)) = parse_github_remote(remote) else {
            continue;
        };

        if !force_refresh {
            if let Some(hit) = cache.get_fresh(&req.path, ttl).await {
                cached.push(hit);
                continue;
            }
        }

        to_fetch.push(RepoRef {
            path: req.path,
            owner,
            name,
            branch: req.current_branch,
        });
    }

    let fresh = github_integrations::fetch_integrations(to_fetch)
        .await
        .map_err(|e| e.to_string())?;

    for item in &fresh {
        cache.put(item.path.clone(), item.clone()).await;
    }

    let mut out = cached;
    out.extend(fresh);
    Ok(out)
}

#[tauri::command]
#[specta::specta]
pub async fn invalidate_github_integrations(state: State<'_, AppState>) -> Result<(), String> {
    state.github_cache.invalidate_all().await;
    Ok(())
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
