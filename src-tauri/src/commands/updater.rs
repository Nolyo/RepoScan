use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::AppHandle;
use tauri_plugin_updater::UpdaterExt;

use crate::domain::types::UpdateChannel;
use crate::services::config_store;

const STABLE_ENDPOINT: &str =
    "https://github.com/Nolyo/RepoScan/releases/latest/download/latest.json";
const BETA_ENDPOINT: &str =
    "https://github.com/Nolyo/RepoScan/releases/download/beta-channel/beta.json";

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UpdateInfo {
    pub version: String,
    pub current_version: String,
    pub date: Option<String>,
    pub body: Option<String>,
}

fn endpoint_for(channel: UpdateChannel) -> &'static str {
    match channel {
        UpdateChannel::Stable => STABLE_ENDPOINT,
        UpdateChannel::Beta => BETA_ENDPOINT,
    }
}

fn active_channel() -> UpdateChannel {
    config_store::load()
        .map(|c| c.update_channel)
        .unwrap_or_default()
}

#[tauri::command]
#[specta::specta]
pub async fn check_for_update(app: AppHandle) -> Result<Option<UpdateInfo>, String> {
    let endpoint = endpoint_for(active_channel())
        .parse()
        .map_err(|e: url::ParseError| e.to_string())?;

    let updater = app
        .updater_builder()
        .endpoints(vec![endpoint])
        .map_err(|e| e.to_string())?
        .build()
        .map_err(|e| e.to_string())?;

    let maybe_update = updater.check().await.map_err(|e| e.to_string())?;
    Ok(maybe_update.map(|u| UpdateInfo {
        version: u.version.clone(),
        current_version: u.current_version.clone(),
        date: u.date.map(|d| d.to_string()),
        body: u.body.clone(),
    }))
}

#[tauri::command]
#[specta::specta]
pub async fn install_update(app: AppHandle) -> Result<(), String> {
    let endpoint = endpoint_for(active_channel())
        .parse()
        .map_err(|e: url::ParseError| e.to_string())?;

    let updater = app
        .updater_builder()
        .endpoints(vec![endpoint])
        .map_err(|e| e.to_string())?
        .build()
        .map_err(|e| e.to_string())?;

    let update = updater
        .check()
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Aucune mise à jour disponible".to_string())?;

    update
        .download_and_install(|_chunk, _total| {}, || {})
        .await
        .map_err(|e| e.to_string())?;

    app.restart()
}
