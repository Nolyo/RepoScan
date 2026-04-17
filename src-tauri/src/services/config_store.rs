use std::path::PathBuf;

use directories::ProjectDirs;

use crate::domain::errors::{AppError, AppResult};
use crate::domain::types::AppConfig;

fn config_path() -> Option<PathBuf> {
    ProjectDirs::from("dev", "RepoScan", "RepoScan")
        .map(|d| d.config_dir().join("config.json"))
}

pub fn config_dir() -> Option<PathBuf> {
    ProjectDirs::from("dev", "RepoScan", "RepoScan")
        .map(|d| d.config_dir().to_path_buf())
}

pub fn load() -> AppResult<AppConfig> {
    let path = config_path().ok_or(AppError::ConfigNotFound)?;
    if !path.exists() {
        return Err(AppError::ConfigNotFound);
    }
    let content = std::fs::read_to_string(&path)?;
    let config: AppConfig = serde_json::from_str(&content)?;
    Ok(config)
}

pub fn save(config: &AppConfig) -> AppResult<()> {
    let path = config_path().ok_or(AppError::ConfigNotFound)?;
    let dir = path.parent().ok_or_else(|| AppError::Other("Invalid config path".into()))?;
    std::fs::create_dir_all(dir)?;

    let content = serde_json::to_string_pretty(config)?;

    // Atomic write: write to .tmp then rename
    let tmp_path = path.with_extension("json.tmp");
    std::fs::write(&tmp_path, content)?;
    std::fs::rename(&tmp_path, &path)?;

    Ok(())
}

pub fn is_first_run() -> bool {
    config_path()
        .map(|p| !p.exists())
        .unwrap_or(true)
}

pub fn get_config_path_str() -> String {
    config_path()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_else(|| "unknown".to_string())
}
