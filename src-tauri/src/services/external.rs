use std::process::Command;

use crate::domain::types::Editor;
use crate::services::platform;

/// Open a directory in the system file explorer
pub fn open_in_explorer(path: &str) {
    if platform::is_wsl() {
        open_in_explorer_wsl(path);
    } else {
        open_native(path);
    }
}

fn open_native(path: &str) {
    #[cfg(target_os = "windows")]
    { let _ = Command::new("explorer").arg(path).spawn(); }
    #[cfg(target_os = "macos")]
    { let _ = Command::new("open").arg(path).spawn(); }
    #[cfg(target_os = "linux")]
    { let _ = Command::new("xdg-open").arg(path).spawn(); }
}

fn open_in_explorer_wsl(path: &str) {
    if let Some(win_path) = platform::to_windows_path(path) {
        // Try explorer.exe with Windows path
        if Command::new("explorer.exe").arg(&win_path).spawn().is_ok() {
            return;
        }
    }
    // Fallback: cmd.exe /c start with Linux path
    let _ = Command::new("cmd.exe")
        .args(["/c", "start", "", path])
        .spawn();
}

/// Open a directory in the specified editor
pub fn open_in_editor(path: &str, editor: &Editor) -> Result<(), String> {
    let binaries = editor.binaries();
    if binaries.is_empty() {
        // System editor: use opener-style fallback
        open_in_explorer(path);
        return Ok(());
    }

    for binary in binaries {
        let cmd = if platform::is_wsl() && !binary.ends_with(".exe") {
            // Try both the base binary and the .exe variant on WSL
            vec![binary.to_string(), format!("{}.exe", binary)]
        } else {
            vec![binary.to_string()]
        };

        for bin in cmd {
            if Command::new(&bin).arg(path).spawn().is_ok() {
                return Ok(());
            }
        }
    }

    Err(format!(
        "{} not found. Install it and make sure it's in PATH.",
        editor.display_name()
    ))
}

/// Open a remote URL, handling WSL → Windows browser cascade
pub fn open_remote_url(remote_url: &str) -> Result<String, String> {
    let https_url = normalize_remote_to_https(remote_url)
        .ok_or_else(|| format!("Cannot convert remote URL to HTTPS: {remote_url}"))?;

    if platform::is_wsl() {
        open_url_wsl(&https_url);
    } else {
        open_url_native(&https_url);
    }

    Ok(https_url)
}

pub fn normalize_remote_to_https(url: &str) -> Option<String> {
    if url.starts_with("https://") || url.starts_with("http://") {
        return Some(url.trim_end_matches(".git").to_string());
    }
    // SSH: git@github.com:owner/repo.git
    let re = regex::Regex::new(r"^git@([\w.\-]+):(.+?)(?:\.git)?$").ok()?;
    if let Some(caps) = re.captures(url) {
        return Some(format!("https://{}/{}", &caps[1], &caps[2]));
    }
    None
}

fn open_url_native(url: &str) {
    #[cfg(target_os = "windows")]
    { let _ = Command::new("cmd").args(["/c", "start", "", url]).spawn(); }
    #[cfg(target_os = "macos")]
    { let _ = Command::new("open").arg(url).spawn(); }
    #[cfg(target_os = "linux")]
    { let _ = Command::new("xdg-open").arg(url).spawn(); }
}

fn open_url_wsl(url: &str) {
    // Cascade: explorer.exe → cmd /c start → powershell Start-Process
    if Command::new("explorer.exe").arg(url).spawn().is_ok() {
        return;
    }
    if Command::new("cmd.exe")
        .args(["/c", "start", "", url])
        .spawn()
        .is_ok()
    {
        return;
    }
    let _ = Command::new("powershell.exe")
        .args(["Start-Process", url])
        .spawn();
}

/// Detect which editors are installed on this machine
pub fn detect_available_editors() -> Vec<Editor> {
    let all_editors = [
        Editor::VsCode,
        Editor::VsCodeInsiders,
        Editor::Cursor,
        Editor::Zed,
        Editor::IntelliJ,
        Editor::WebStorm,
        Editor::PyCharm,
        Editor::Rider,
        Editor::Fleet,
        Editor::Sublime,
        Editor::Neovim,
        Editor::Vim,
    ];

    let mut available = Vec::new();
    for editor in &all_editors {
        if is_editor_available(editor) {
            available.push(editor.clone());
        }
    }
    available
}

fn is_editor_available(editor: &Editor) -> bool {
    for binary in editor.binaries() {
        if which_binary(binary) {
            return true;
        }
    }
    false
}

fn which_binary(binary: &str) -> bool {
    #[cfg(unix)]
    {
        Command::new("which")
            .arg(binary)
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .status()
            .map(|s| s.success())
            .unwrap_or(false)
    }
    #[cfg(windows)]
    {
        Command::new("where")
            .arg(binary)
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .status()
            .map(|s| s.success())
            .unwrap_or(false)
    }
}

/// On WSL, wsl environments also have .exe binaries accessible
pub fn copy_path_to_clipboard_cmd(path: &str) -> String {
    format!("code '{}'", path.replace('\'', "\\'"))
}
