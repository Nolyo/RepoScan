use tauri::AppHandle;
use tauri_plugin_clipboard_manager::ClipboardExt;

use crate::domain::types::Editor;
use crate::services::external;

#[tauri::command]
#[specta::specta]
pub fn open_in_explorer(path: String) {
    external::open_in_explorer(&path);
}

#[tauri::command]
#[specta::specta]
pub fn open_in_editor(path: String, editor: Editor) -> Result<(), String> {
    external::open_in_editor(&path, &editor)
}

#[tauri::command]
#[specta::specta]
pub fn open_remote_url(remote_url: String) -> Result<String, String> {
    external::open_remote_url(&remote_url)
}

#[tauri::command]
#[specta::specta]
pub fn copy_path(app: AppHandle, path: String) -> Result<(), String> {
    app.clipboard().write_text(path).map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub fn copy_code_command(app: AppHandle, path: String) -> Result<(), String> {
    let cmd = format!("code '{}'", path.replace('\'', "\\'"));
    app.clipboard().write_text(cmd).map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub fn detect_available_editors() -> Vec<Editor> {
    external::detect_available_editors()
}
