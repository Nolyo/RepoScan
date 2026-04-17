use std::collections::HashMap;
use std::time::Duration;

use serde::Deserialize;
use tokio::process::Command;

use crate::domain::errors::{AppError, AppResult};
use crate::domain::types::{CiState, RepoIntegration};

const QUERY_TIMEOUT_SECS: u64 = 30;

#[derive(Debug, Clone)]
pub struct RepoRef {
    pub path: String,
    pub owner: String,
    pub name: String,
    pub branch: Option<String>,
}

pub fn parse_github_remote(url: &str) -> Option<(String, String)> {
    let url = url.trim().trim_end_matches(".git");
    let rest = if let Some(r) = url.strip_prefix("git@github.com:") {
        r
    } else if let Some(r) = url.strip_prefix("https://github.com/") {
        r
    } else if let Some(r) = url.strip_prefix("http://github.com/") {
        r
    } else if let Some(r) = url.strip_prefix("ssh://git@github.com/") {
        r
    } else {
        return None;
    };
    let mut parts = rest.splitn(2, '/');
    let owner = parts.next()?.to_string();
    let name = parts.next()?.to_string();
    if owner.is_empty() || name.is_empty() {
        return None;
    }
    Some((owner, name))
}

fn gh_missing(e: &std::io::Error) -> bool {
    e.kind() == std::io::ErrorKind::NotFound
}

pub async fn fetch_integrations(refs: Vec<RepoRef>) -> AppResult<Vec<RepoIntegration>> {
    if refs.is_empty() {
        return Ok(Vec::new());
    }

    let mut by_owner: HashMap<String, Vec<RepoRef>> = HashMap::new();
    for r in refs {
        by_owner.entry(r.owner.clone()).or_default().push(r);
    }

    let mut results: Vec<RepoIntegration> = Vec::new();
    for (_owner, group) in by_owner {
        match fetch_owner_group(&group).await {
            Ok(mut items) => results.append(&mut items),
            Err(e) => {
                log::warn!("Échec fetch intégrations GitHub : {e}");
                for r in &group {
                    results.push(empty_integration(r));
                }
            }
        }
    }

    Ok(results)
}

fn empty_integration(r: &RepoRef) -> RepoIntegration {
    RepoIntegration {
        path: r.path.clone(),
        owner: r.owner.clone(),
        name: r.name.clone(),
        pr_count: None,
        pr_url: None,
        ci_state: None,
        ci_url: None,
        ci_workflow_name: None,
        fetched_at_iso: now_iso(),
    }
}

fn now_iso() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    format!("{secs}")
}

fn build_query(group: &[RepoRef]) -> String {
    let mut fragments = String::new();
    for (idx, r) in group.iter().enumerate() {
        let branch = r.branch.as_deref().unwrap_or("HEAD");
        fragments.push_str(&format!(
            r#"
  repo{idx}: repository(owner: "{owner}", name: "{name}") {{
    url
    pullRequests(states: OPEN) {{ totalCount }}
    object(expression: "{branch}") {{
      ... on Commit {{
        statusCheckRollup {{ state }}
        checkSuites(last: 1) {{
          nodes {{
            status
            conclusion
            workflowRun {{ url workflow {{ name }} }}
          }}
        }}
      }}
    }}
  }}
"#,
            idx = idx,
            owner = escape_gql(&r.owner),
            name = escape_gql(&r.name),
            branch = escape_gql(branch),
        ));
    }
    format!("query {{{fragments}}}")
}

fn escape_gql(s: &str) -> String {
    s.replace('\\', "\\\\").replace('"', "\\\"")
}

#[derive(Debug, Deserialize)]
struct GqlResponse {
    data: Option<serde_json::Value>,
    errors: Option<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
struct GqlRepo {
    url: Option<String>,
    #[serde(rename = "pullRequests")]
    pull_requests: Option<GqlPrCount>,
    object: Option<GqlCommit>,
}

#[derive(Debug, Deserialize)]
struct GqlPrCount {
    #[serde(rename = "totalCount")]
    total_count: u32,
}

#[derive(Debug, Deserialize)]
struct GqlCommit {
    #[serde(rename = "statusCheckRollup")]
    status_check_rollup: Option<GqlRollup>,
    #[serde(rename = "checkSuites")]
    check_suites: Option<GqlCheckSuites>,
}

#[derive(Debug, Deserialize)]
struct GqlRollup {
    state: Option<String>,
}

#[derive(Debug, Deserialize)]
struct GqlCheckSuites {
    nodes: Vec<GqlCheckSuite>,
}

#[derive(Debug, Deserialize)]
struct GqlCheckSuite {
    status: Option<String>,
    conclusion: Option<String>,
    #[serde(rename = "workflowRun")]
    workflow_run: Option<GqlWorkflowRun>,
}

#[derive(Debug, Deserialize)]
struct GqlWorkflowRun {
    url: Option<String>,
    workflow: Option<GqlWorkflow>,
}

#[derive(Debug, Deserialize)]
struct GqlWorkflow {
    name: Option<String>,
}

async fn fetch_owner_group(group: &[RepoRef]) -> AppResult<Vec<RepoIntegration>> {
    let query = build_query(group);

    let mut cmd = Command::new("gh");
    cmd.args(["api", "graphql", "-f"])
        .arg(format!("query={query}"));

    let output = tokio::time::timeout(Duration::from_secs(QUERY_TIMEOUT_SECS), cmd.output())
        .await
        .map_err(|_| AppError::Other("Requête GraphQL GitHub expirée".into()))?
        .map_err(|e| {
            if gh_missing(&e) {
                AppError::Other("La CLI GitHub `gh` est introuvable dans le PATH".into())
            } else {
                AppError::Other(format!("Échec `gh api graphql` : {e}"))
            }
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        return Err(AppError::Other(if stderr.is_empty() {
            format!("gh api graphql a échoué (exit {})", output.status)
        } else {
            stderr
        }));
    }

    let parsed: GqlResponse = serde_json::from_slice(&output.stdout)?;
    if let Some(errors) = &parsed.errors {
        log::warn!("GraphQL errors (partial): {errors}");
    }
    let data = parsed
        .data
        .ok_or_else(|| AppError::Other("Réponse GraphQL sans data".into()))?;

    let mut out = Vec::with_capacity(group.len());
    for (idx, r) in group.iter().enumerate() {
        let key = format!("repo{idx}");
        let repo_value = data.get(&key);
        out.push(build_integration(r, repo_value));
    }
    Ok(out)
}

fn build_integration(r: &RepoRef, repo_value: Option<&serde_json::Value>) -> RepoIntegration {
    let Some(repo_value) = repo_value else {
        return empty_integration(r);
    };
    if repo_value.is_null() {
        return empty_integration(r);
    }

    let parsed: Result<GqlRepo, _> = serde_json::from_value(repo_value.clone());
    let Ok(repo) = parsed else {
        return empty_integration(r);
    };

    let pr_count = repo.pull_requests.as_ref().map(|p| p.total_count);
    let pr_url = repo.url.as_ref().map(|u| format!("{u}/pulls"));

    let (ci_state, ci_url, ci_workflow_name) = extract_ci(&repo);

    RepoIntegration {
        path: r.path.clone(),
        owner: r.owner.clone(),
        name: r.name.clone(),
        pr_count,
        pr_url,
        ci_state,
        ci_url,
        ci_workflow_name,
        fetched_at_iso: now_iso(),
    }
}

fn extract_ci(repo: &GqlRepo) -> (Option<CiState>, Option<String>, Option<String>) {
    let commit = match &repo.object {
        Some(c) => c,
        None => return (None, None, None),
    };

    let rollup_state = commit
        .status_check_rollup
        .as_ref()
        .and_then(|r| r.state.as_deref());

    let last_run = commit
        .check_suites
        .as_ref()
        .and_then(|cs| cs.nodes.last())
        .and_then(|n| n.workflow_run.as_ref());
    let ci_url = last_run.and_then(|w| w.url.clone());
    let ci_workflow_name = last_run
        .and_then(|w| w.workflow.as_ref())
        .and_then(|wf| wf.name.clone());

    let ci_state = match rollup_state {
        Some("SUCCESS") => Some(CiState::Success),
        Some("FAILURE") | Some("ERROR") => Some(CiState::Failure),
        Some("PENDING") | Some("EXPECTED") => Some(CiState::Pending),
        Some(_) => Some(CiState::Neutral),
        None => {
            // Fallback : dériver depuis le dernier checkSuite
            commit
                .check_suites
                .as_ref()
                .and_then(|cs| cs.nodes.last())
                .map(|n| match (n.status.as_deref(), n.conclusion.as_deref()) {
                    (_, Some("SUCCESS")) => CiState::Success,
                    (_, Some("FAILURE") | Some("TIMED_OUT") | Some("STARTUP_FAILURE")) => {
                        CiState::Failure
                    }
                    (Some("IN_PROGRESS") | Some("QUEUED") | Some("PENDING"), _) => CiState::Pending,
                    (_, Some(_)) => CiState::Neutral,
                    _ => CiState::Unknown,
                })
        }
    };

    (ci_state, ci_url, ci_workflow_name)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_https_remote() {
        assert_eq!(
            parse_github_remote("https://github.com/Nolyo/RepoScan.git"),
            Some(("Nolyo".into(), "RepoScan".into()))
        );
    }

    #[test]
    fn parses_ssh_remote() {
        assert_eq!(
            parse_github_remote("git@github.com:Nolyo/RepoScan.git"),
            Some(("Nolyo".into(), "RepoScan".into()))
        );
    }

    #[test]
    fn rejects_non_github() {
        assert_eq!(parse_github_remote("https://gitlab.com/a/b.git"), None);
    }

    #[test]
    fn builds_query_with_aliases() {
        let refs = vec![
            RepoRef {
                path: "/a".into(),
                owner: "o1".into(),
                name: "r1".into(),
                branch: Some("main".into()),
            },
            RepoRef {
                path: "/b".into(),
                owner: "o1".into(),
                name: "r2".into(),
                branch: None,
            },
        ];
        let q = build_query(&refs);
        assert!(q.contains("repo0: repository(owner: \"o1\", name: \"r1\")"));
        assert!(q.contains("repo1: repository(owner: \"o1\", name: \"r2\")"));
        assert!(q.contains("expression: \"main\""));
        assert!(q.contains("expression: \"HEAD\""));
    }
}
