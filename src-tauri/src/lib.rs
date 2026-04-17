use std::sync::Arc;

use tauri::Manager;

pub mod commands;
pub mod domain;
pub mod services;

pub struct AppState {
    pub fetch_state: Arc<services::fetcher::FetchState>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri_specta::Builder::<tauri::Wry>::new()
        .commands(tauri_specta::collect_commands![
            commands::scan::scan_repositories,
            commands::scan::refresh_repo,
            commands::scan::preview_scan,
            commands::fetch::fetch_repo,
            commands::fetch::fetch_all,
            commands::fetch::cancel_fetch_all,
            commands::config::load_config,
            commands::config::save_config,
            commands::config::reset_config,
            commands::config::get_config_path,
            commands::external::open_in_explorer,
            commands::external::open_in_editor,
            commands::external::open_remote_url,
            commands::external::copy_path,
            commands::external::copy_code_command,
            commands::external::detect_available_editors,
            commands::onboarding::is_first_run,
            commands::onboarding::detect_default_repo_path,
            commands::onboarding::platform_info,
            commands::github::check_gh_auth,
            commands::github::search_github_repos,
            commands::github::clone_github_repo,
            commands::github::install_repo_deps,
            commands::updater::check_for_update,
            commands::updater::install_update,
        ]);

    // Export TypeScript bindings in debug builds
    #[cfg(debug_assertions)]
    builder
        .export(
            specta_typescript::Typescript::default()
                .bigint(specta_typescript::BigIntExportBehavior::Number)
                .header("// @ts-nocheck\n"),
            "../src/bindings.ts",
        )
        .expect("Failed to export TypeScript bindings");

    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(log::LevelFilter::Info)
                .build(),
        )
        .manage(AppState {
            fetch_state: Arc::new(services::fetcher::FetchState::default()),
        })
        .invoke_handler(builder.invoke_handler())
        .setup(move |app| {
            builder.mount_events(app);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running RepoScan");
}
