use tauri::{AppHandle, Emitter};

use crate::domain::types::{FetchProgress, FetchResult};
use crate::services::{config_store, fetcher};
use crate::AppState;

#[tauri::command]
#[specta::specta]
pub async fn fetch_repo(path: String, _state: tauri::State<'_, AppState>) -> Result<FetchResult, String> {
    let config = config_store::load().unwrap_or_default();
    let result = fetcher::fetch_one(&path, config.fetch_timeout_seconds).await;
    Ok(result)
}

#[tauri::command]
#[specta::specta]
pub async fn fetch_all(
    paths: Vec<String>,
    app: AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<Vec<FetchResult>, String> {
    let config = config_store::load().unwrap_or_default();
    let fetch_state = state.fetch_state.clone();

    let app_clone = app.clone();
    let results = fetcher::fetch_all(
        paths,
        config.fetch_concurrency,
        config.fetch_timeout_seconds,
        fetch_state,
        move |progress: FetchProgress| {
            let _ = app_clone.emit("fetch_progress", &progress);
        },
    )
    .await;

    Ok(results)
}

#[tauri::command]
#[specta::specta]
pub async fn cancel_fetch_all(state: tauri::State<'_, AppState>) -> Result<(), String> {
    fetcher::cancel_fetch(state.fetch_state.clone()).await;
    Ok(())
}
