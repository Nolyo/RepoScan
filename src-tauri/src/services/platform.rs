use once_cell::sync::Lazy;

use crate::domain::types::PlatformInfo;

static IS_WSL: Lazy<bool> = Lazy::new(|| {
    std::fs::read_to_string("/proc/version")
        .map(|v| {
            let lower = v.to_lowercase();
            lower.contains("microsoft") || lower.contains("wsl")
        })
        .unwrap_or(false)
});

static WSL_DISTRO: Lazy<Option<String>> = Lazy::new(|| {
    std::env::var("WSL_DISTRO_NAME").ok()
});

pub fn is_wsl() -> bool {
    *IS_WSL
}

pub fn platform_info() -> PlatformInfo {
    let os = std::env::consts::OS.to_string();
    let home_dir = dirs::home_dir()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_else(|| "/".to_string());

    PlatformInfo {
        os,
        is_wsl: *IS_WSL,
        wsl_distro: WSL_DISTRO.clone(),
        home_dir,
    }
}

/// Convert a Linux path to Windows path via wslpath (WSL only)
pub fn to_windows_path(linux_path: &str) -> Option<String> {
    if !is_wsl() {
        return None;
    }
    let output = std::process::Command::new("wslpath")
        .arg("-w")
        .arg(linux_path)
        .output()
        .ok()?;
    if output.status.success() {
        Some(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        None
    }
}

/// Detect a likely default repository root path
pub fn detect_default_repo_path() -> String {
    let home = dirs::home_dir().unwrap_or_else(|| std::path::PathBuf::from("/"));
    let candidates = ["www", "projects", "repos", "dev", "code", "src"];
    for candidate in candidates {
        let path = home.join(candidate);
        if path.is_dir() {
            return path.to_string_lossy().to_string();
        }
    }
    home.to_string_lossy().to_string()
}
