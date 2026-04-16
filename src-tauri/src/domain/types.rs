use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct RepoInfo {
    pub path: String,
    pub relative_path: String,
    pub name: String,
    pub depth: u32,
    pub kind: RepoKind,
    pub current_branch: Option<String>,
    pub last_commit: Option<CommitInfo>,
    pub status: RepoStatus,
    pub ahead_behind: Option<AheadBehind>,
    pub remote_url: Option<String>,
    pub remote_short: Option<String>,
    pub children: Vec<RepoInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum RepoKind {
    Git,
    Submodule,
    ParentFolder,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CommitInfo {
    pub short_hash: String,
    pub subject: String,
    pub date_iso: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct RepoStatus {
    pub clean: bool,
    pub modified: u32,
    pub added: u32,
    pub deleted: u32,
    pub renamed: u32,
    pub untracked: u32,
    pub conflicted: u32,
    pub staged_modified: u32,
}

impl RepoStatus {
    pub fn clean() -> Self {
        RepoStatus {
            clean: true,
            modified: 0,
            added: 0,
            deleted: 0,
            renamed: 0,
            untracked: 0,
            conflicted: 0,
            staged_modified: 0,
        }
    }

    pub fn is_clean(&self) -> bool {
        self.modified == 0
            && self.added == 0
            && self.deleted == 0
            && self.renamed == 0
            && self.untracked == 0
            && self.conflicted == 0
            && self.staged_modified == 0
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct AheadBehind {
    pub ahead: usize,
    pub behind: usize,
    pub has_upstream: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    pub root_path: String,
    pub max_scan_depth: u8,
    pub show_empty_folders: bool,
    pub fetch_timeout_seconds: u32,
    pub fetch_concurrency: u8,
    pub theme: Theme,
    pub window: WindowState,
    pub preferred_editor: Editor,
    pub version: u32,
}

impl Default for AppConfig {
    fn default() -> Self {
        AppConfig {
            root_path: String::new(),
            max_scan_depth: 3,
            show_empty_folders: true,
            fetch_timeout_seconds: 30,
            fetch_concurrency: 8,
            theme: Theme::System,
            window: WindowState::default(),
            preferred_editor: Editor::VsCode,
            version: 1,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum Theme {
    System,
    Light,
    Dark,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct WindowState {
    pub width: u32,
    pub height: u32,
}

impl Default for WindowState {
    fn default() -> Self {
        WindowState { width: 1400, height: 900 }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum Editor {
    VsCode,
    VsCodeInsiders,
    Cursor,
    Zed,
    IntelliJ,
    WebStorm,
    PyCharm,
    Rider,
    Fleet,
    Sublime,
    Neovim,
    Vim,
    System,
}

impl Editor {
    pub fn binaries(&self) -> &'static [&'static str] {
        match self {
            Editor::VsCode => &["code", "code.exe"],
            Editor::VsCodeInsiders => &["code-insiders", "code-insiders.exe"],
            Editor::Cursor => &["cursor", "cursor.exe"],
            Editor::Zed => &["zed", "zed.exe"],
            Editor::IntelliJ => &["idea", "idea.sh", "idea64.exe"],
            Editor::WebStorm => &["webstorm", "webstorm.sh", "webstorm64.exe"],
            Editor::PyCharm => &["pycharm", "pycharm.sh", "pycharm64.exe"],
            Editor::Rider => &["rider", "rider.sh", "rider64.exe"],
            Editor::Fleet => &["fleet", "fleet.exe"],
            Editor::Sublime => &["subl", "subl.exe"],
            Editor::Neovim => &["nvim"],
            Editor::Vim => &["vim"],
            Editor::System => &[],
        }
    }

    pub fn display_name(&self) -> &'static str {
        match self {
            Editor::VsCode => "VS Code",
            Editor::VsCodeInsiders => "VS Code Insiders",
            Editor::Cursor => "Cursor",
            Editor::Zed => "Zed",
            Editor::IntelliJ => "IntelliJ IDEA",
            Editor::WebStorm => "WebStorm",
            Editor::PyCharm => "PyCharm",
            Editor::Rider => "Rider",
            Editor::Fleet => "Fleet",
            Editor::Sublime => "Sublime Text",
            Editor::Neovim => "Neovim",
            Editor::Vim => "Vim",
            Editor::System => "System",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ScanPreview {
    pub repos_count: usize,
    pub folders_count: usize,
    pub sample: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct FetchResult {
    pub path: String,
    pub success: bool,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct FetchProgress {
    pub repo_path: String,
    pub repo_name: String,
    pub phase: FetchPhase,
    pub message: Option<String>,
    pub repos_done: usize,
    pub repos_total: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum FetchPhase {
    Queued,
    Running,
    Done,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct PlatformInfo {
    pub os: String,
    pub is_wsl: bool,
    pub wsl_distro: Option<String>,
    pub home_dir: String,
}
