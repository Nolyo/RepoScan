use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};

use tokio::sync::Mutex;

use crate::domain::types::RepoIntegration;

pub const DEFAULT_TTL_SECS: u64 = 600;

struct CacheEntry {
    data: RepoIntegration,
    fetched_at: Instant,
}

pub struct GithubCache {
    entries: Arc<Mutex<HashMap<String, CacheEntry>>>,
}

impl Default for GithubCache {
    fn default() -> Self {
        GithubCache {
            entries: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}

impl GithubCache {
    pub async fn get_fresh(&self, path: &str, ttl: Duration) -> Option<RepoIntegration> {
        let guard = self.entries.lock().await;
        let entry = guard.get(path)?;
        if entry.fetched_at.elapsed() > ttl {
            return None;
        }
        Some(entry.data.clone())
    }

    pub async fn put(&self, path: String, data: RepoIntegration) {
        let mut guard = self.entries.lock().await;
        guard.insert(
            path,
            CacheEntry {
                data,
                fetched_at: Instant::now(),
            },
        );
    }

    pub async fn invalidate_all(&self) {
        let mut guard = self.entries.lock().await;
        guard.clear();
    }
}
