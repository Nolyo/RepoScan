# Lanceur silencieux - aucune console visible
# Ce script PowerShell lance l'application complètement en arrière-plan

$ErrorActionPreference = 'SilentlyContinue'

# Lire la configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ConfigPath = Join-Path $ScriptDir "config.json"
$AppName = "RepoScan"
$WSLDistro = "Ubuntu"
$LinuxProjectPath = "~/www/repo-scan"

if (Test-Path $ConfigPath) {
    try {
        $cfg = Get-Content -Raw $ConfigPath | ConvertFrom-Json
        if ($cfg.app_name) { $AppName = $cfg.app_name }
        if ($cfg.windows.distro) { $WSLDistro = $cfg.windows.distro }
        if ($cfg.windows.linux_project_path) { $LinuxProjectPath = $cfg.windows.linux_project_path }
    } catch {}
}

# Lancer en arrière-plan sans fenêtre
$ProcessInfo = New-Object System.Diagnostics.ProcessStartInfo
$ProcessInfo.FileName = "wsl.exe"
$ProcessInfo.Arguments = "-d $WSLDistro -- bash -lc `"cd '$LinuxProjectPath' && bash ./scripts/linux/launch_explorer.sh`""
$ProcessInfo.CreateNoWindow = $true
$ProcessInfo.UseShellExecute = $false
$ProcessInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden

[System.Diagnostics.Process]::Start($ProcessInfo) | Out-Null