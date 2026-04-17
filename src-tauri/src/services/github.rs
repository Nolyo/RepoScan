use std::path::{Path, PathBuf};
use std::process::Stdio;
use std::sync::Arc;
use std::time::Duration;

use serde::Deserialize;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;

use crate::domain::errors::{AppError, AppResult};
use crate::domain::types::{DepManager, GhAuthStatus, GithubRepoResult};

const SEARCH_TIMEOUT_SECS: u64 = 30;
const CLONE_TIMEOUT_SECS: u64 = 300;
const INSTALL_TIMEOUT_SECS: u64 = 600;

#[derive(Debug, Deserialize)]
struct GhSearchRepo {
    #[serde(rename = "fullName")]
    full_name: String,
    description: Option<String>,
    #[serde(rename = "stargazersCount", default)]
    stargazers_count: u32,
    url: Option<String>,
}

fn gh_missing(e: &std::io::Error) -> bool {
    e.kind() == std::io::ErrorKind::NotFound
}

pub async fn check_auth() -> GhAuthStatus {
    let result = Command::new("gh")
        .args(["auth", "status", "--hostname", "github.com"])
        .output()
        .await;

    match result {
        Err(e) if gh_missing(&e) => GhAuthStatus {
            logged_in: false,
            gh_missing: true,
            user: None,
        },
        Err(_) => GhAuthStatus {
            logged_in: false,
            gh_missing: false,
            user: None,
        },
        Ok(output) => {
            if !output.status.success() {
                return GhAuthStatus {
                    logged_in: false,
                    gh_missing: false,
                    user: None,
                };
            }
            let combined = format!(
                "{}{}",
                String::from_utf8_lossy(&output.stdout),
                String::from_utf8_lossy(&output.stderr)
            );
            let user = combined.lines().find_map(parse_user_line);
            GhAuthStatus {
                logged_in: true,
                gh_missing: false,
                user,
            }
        }
    }
}

fn parse_user_line(line: &str) -> Option<String> {
    let line = line.trim();
    for prefix in [
        "Logged in to github.com account ",
        "Logged in to github.com as ",
    ] {
        if let Some(rest) = line.strip_prefix(prefix) {
            let user = rest
                .split_whitespace()
                .next()?
                .trim_end_matches(',')
                .to_string();
            if !user.is_empty() {
                return Some(user);
            }
        }
    }
    None
}

pub async fn search(
    query: &str,
    owner: Option<&str>,
    limit: u32,
) -> AppResult<Vec<GithubRepoResult>> {
    let query = query.trim();
    if query.is_empty() {
        return Ok(Vec::new());
    }

    let mut cmd = Command::new("gh");
    cmd.arg("search").arg("repos").arg(query);
    if let Some(owner) = owner {
        if !owner.trim().is_empty() {
            cmd.arg(format!("--owner={}", owner.trim()));
        }
    }
    cmd.arg(format!("--limit={limit}"))
        .arg("--json")
        .arg("fullName,description,stargazersCount,url");

    let output = tokio::time::timeout(Duration::from_secs(SEARCH_TIMEOUT_SECS), cmd.output())
        .await
        .map_err(|_| AppError::Other("Recherche GitHub expirée".into()))?
        .map_err(|e| {
            if gh_missing(&e) {
                AppError::Other("La CLI GitHub `gh` est introuvable dans le PATH".into())
            } else {
                AppError::Other(format!("Échec `gh search repos` : {e}"))
            }
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        return Err(AppError::Other(if stderr.is_empty() {
            format!("gh search repos a échoué (exit {})", output.status)
        } else {
            stderr
        }));
    }

    let parsed: Vec<GhSearchRepo> = serde_json::from_slice(&output.stdout)?;
    Ok(parsed
        .into_iter()
        .map(|r| GithubRepoResult {
            full_name: r.full_name,
            description: r.description,
            stars: r.stargazers_count,
            url: r.url,
        })
        .collect())
}

pub async fn clone(full_name: &str, dest_parent: &Path) -> AppResult<PathBuf> {
    let repo_name = full_name
        .split('/')
        .last()
        .filter(|s| !s.is_empty())
        .ok_or_else(|| AppError::Other(format!("Nom de dépôt invalide : {full_name}")))?;

    tokio::fs::create_dir_all(dest_parent).await?;

    let target = dest_parent.join(repo_name);
    if target.exists() {
        return Err(AppError::Other(format!(
            "Le dossier {} existe déjà",
            target.display()
        )));
    }

    let mut cmd = Command::new("gh");
    cmd.args(["repo", "clone", full_name])
        .current_dir(dest_parent)
        .env("GIT_TERMINAL_PROMPT", "0");
    for var in &["SSH_AUTH_SOCK", "GIT_SSH", "GIT_SSH_COMMAND", "GIT_ASKPASS"] {
        if let Ok(val) = std::env::var(var) {
            cmd.env(var, val);
        }
    }

    let output = tokio::time::timeout(Duration::from_secs(CLONE_TIMEOUT_SECS), cmd.output())
        .await
        .map_err(|_| AppError::Other("Clone expiré".into()))?
        .map_err(|e| {
            if gh_missing(&e) {
                AppError::Other("La CLI GitHub `gh` est introuvable dans le PATH".into())
            } else {
                AppError::Other(format!("Échec `gh repo clone` : {e}"))
            }
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        return Err(AppError::Other(if stderr.is_empty() {
            format!("gh repo clone a échoué (exit {})", output.status)
        } else {
            stderr
        }));
    }

    Ok(target)
}

pub fn detect_dep_manager(repo_path: &Path) -> Option<DepManager> {
    if repo_path.join("yarn.lock").is_file() {
        Some(DepManager::Yarn)
    } else if repo_path.join("package.json").is_file() {
        Some(DepManager::Npm)
    } else {
        None
    }
}

pub async fn install_deps<F>(repo_path: &Path, mgr: DepManager, on_line: F) -> AppResult<()>
where
    F: Fn(String) + Send + Sync + 'static,
{
    let (program, args): (&str, &[&str]) = match mgr {
        DepManager::Yarn => ("yarn", &["install"]),
        DepManager::Npm => ("npm", &["install"]),
    };

    let mut child = Command::new(program)
        .args(args)
        .current_dir(repo_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| {
            if gh_missing(&e) {
                AppError::Other(format!("`{program}` introuvable dans le PATH"))
            } else {
                AppError::Other(format!("Échec spawn {program} : {e}"))
            }
        })?;

    let stdout = child.stdout.take().expect("stdout piped");
    let stderr = child.stderr.take().expect("stderr piped");

    let on_line = Arc::new(on_line);
    let out_cb = on_line.clone();
    let err_cb = on_line.clone();

    let stdout_task = tokio::spawn(async move {
        let mut reader = BufReader::new(stdout).lines();
        while let Ok(Some(line)) = reader.next_line().await {
            out_cb(line);
        }
    });

    let stderr_task = tokio::spawn(async move {
        let mut reader = BufReader::new(stderr).lines();
        while let Ok(Some(line)) = reader.next_line().await {
            err_cb(line);
        }
    });

    let status = tokio::time::timeout(Duration::from_secs(INSTALL_TIMEOUT_SECS), child.wait())
        .await
        .map_err(|_| AppError::Other(format!("Installation {program} expirée")))?
        .map_err(|e| AppError::Other(format!("Échec wait {program} : {e}")))?;

    let _ = stdout_task.await;
    let _ = stderr_task.await;

    if !status.success() {
        return Err(AppError::Other(format!(
            "{program} install a échoué (exit {status})"
        )));
    }

    Ok(())
}
