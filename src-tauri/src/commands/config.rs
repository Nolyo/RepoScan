use crate::domain::types::AppConfig;
use crate::services::config_store;

#[tauri::command]
#[specta::specta]
pub fn load_config() -> AppConfig {
    config_store::load().unwrap_or_default()
}

#[tauri::command]
#[specta::specta]
pub fn save_config(config: AppConfig) -> Result<(), String> {
    config_store::save(&config).map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub fn reset_config() -> AppConfig {
    AppConfig::default()
}

#[tauri::command]
#[specta::specta]
pub fn get_config_path() -> String {
    config_store::get_config_path_str()
}
