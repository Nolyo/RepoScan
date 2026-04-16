use crate::services::{config_store, platform};

#[tauri::command]
#[specta::specta]
pub fn is_first_run() -> bool {
    config_store::is_first_run()
}

#[tauri::command]
#[specta::specta]
pub fn detect_default_repo_path() -> String {
    platform::detect_default_repo_path()
}

#[tauri::command]
#[specta::specta]
pub fn platform_info() -> crate::domain::types::PlatformInfo {
    platform::platform_info()
}
