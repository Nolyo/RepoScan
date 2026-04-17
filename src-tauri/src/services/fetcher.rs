use std::sync::Arc;
use std::time::Duration;

use tokio::sync::{Mutex, Semaphore};
use tokio_util::sync::CancellationToken;

use crate::domain::types::{FetchPhase, FetchProgress, FetchResult};

pub struct FetchState {
    pub cancel_token: Arc<Mutex<Option<CancellationToken>>>,
}

impl Default for FetchState {
    fn default() -> Self {
        FetchState {
            cancel_token: Arc::new(Mutex::new(None)),
        }
    }
}

pub async fn fetch_one(path: &str, timeout_secs: u32) -> FetchResult {
    let name = std::path::Path::new(path)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or(path)
        .to_string();

    let mut cmd = tokio::process::Command::new("git");
    cmd.arg("-C")
        .arg(path)
        .args(["fetch", "--all", "--prune"])
        .env("GIT_TERMINAL_PROMPT", "0")
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped());

    // Forward SSH credentials
    for var in &["SSH_AUTH_SOCK", "GIT_SSH", "GIT_SSH_COMMAND", "GIT_ASKPASS"] {
        if let Ok(val) = std::env::var(var) {
            cmd.env(var, val);
        }
    }

    let result = tokio::time::timeout(
        Duration::from_secs(timeout_secs as u64),
        cmd.output(),
    )
    .await;

    match result {
        Ok(Ok(output)) if output.status.success() => FetchResult {
            path: path.to_string(),
            success: true,
            message: String::from_utf8_lossy(&output.stderr).trim().to_string(),
        },
        Ok(Ok(output)) => {
            let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
            FetchResult {
                path: path.to_string(),
                success: false,
                message: if stderr.is_empty() {
                    format!("git fetch failed (exit {})", output.status)
                } else {
                    stderr
                },
            }
        }
        Ok(Err(e)) => FetchResult {
            path: path.to_string(),
            success: false,
            message: format!("Failed to spawn git: {e}"),
        },
        Err(_) => FetchResult {
            path: path.to_string(),
            success: false,
            message: format!("Fetch timed out after {timeout_secs}s — {name}"),
        },
    }
}

pub async fn fetch_all<F>(
    paths: Vec<String>,
    concurrency: u8,
    timeout_secs: u32,
    state: Arc<FetchState>,
    on_progress: F,
) -> Vec<FetchResult>
where
    F: Fn(FetchProgress) + Send + Sync + 'static,
{
    let total = paths.len();
    let semaphore = Arc::new(Semaphore::new(concurrency as usize));
    let on_progress = Arc::new(on_progress);
    let done_counter = Arc::new(std::sync::atomic::AtomicUsize::new(0));

    // Create a fresh cancel token
    let cancel_token = CancellationToken::new();
    {
        let mut lock = state.cancel_token.lock().await;
        *lock = Some(cancel_token.clone());
    }

    let mut handles = Vec::new();

    for path in paths {
        let sem = semaphore.clone();
        let on_progress = on_progress.clone();
        let done_counter = done_counter.clone();
        let cancel_token = cancel_token.clone();
        let name = std::path::Path::new(&path)
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or(&path)
            .to_string();

        on_progress(FetchProgress {
            repo_path: path.clone(),
            repo_name: name.clone(),
            phase: FetchPhase::Queued,
            message: None,
            repos_done: done_counter.load(std::sync::atomic::Ordering::Relaxed),
            repos_total: total,
        });

        let handle = tokio::spawn(async move {
            if cancel_token.is_cancelled() {
                return FetchResult { path, success: false, message: "Cancelled".into() };
            }

            let _permit = sem.acquire().await.unwrap();

            if cancel_token.is_cancelled() {
                return FetchResult { path, success: false, message: "Cancelled".into() };
            }

            on_progress(FetchProgress {
                repo_path: path.clone(),
                repo_name: name.clone(),
                phase: FetchPhase::Running,
                message: None,
                repos_done: done_counter.load(std::sync::atomic::Ordering::Relaxed),
                repos_total: total,
            });

            let result = tokio::select! {
                r = fetch_one(&path, timeout_secs) => r,
                _ = cancel_token.cancelled() => FetchResult {
                    path: path.clone(),
                    success: false,
                    message: "Cancelled".into(),
                },
            };

            let done = done_counter.fetch_add(1, std::sync::atomic::Ordering::Relaxed) + 1;

            on_progress(FetchProgress {
                repo_path: result.path.clone(),
                repo_name: name,
                phase: if result.success { FetchPhase::Done } else { FetchPhase::Error },
                message: Some(result.message.clone()),
                repos_done: done,
                repos_total: total,
            });

            result
        });

        handles.push(handle);
    }

    let mut results = Vec::new();
    for handle in handles {
        if let Ok(result) = handle.await {
            results.push(result);
        }
    }

    // Clear cancel token
    {
        let mut lock = state.cancel_token.lock().await;
        *lock = None;
    }

    results
}

pub async fn cancel_fetch(state: Arc<FetchState>) {
    let lock = state.cancel_token.lock().await;
    if let Some(token) = lock.as_ref() {
        token.cancel();
    }
}
