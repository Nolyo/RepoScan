# Script PowerShell pour créer un raccourci sur le bureau
# Raccourci de l'application (nom dynamique via config)

Write-Host "=== Creation du raccourci bureau ===" -ForegroundColor Green
Write-Host ""

# Chemins
$DesktopPath = [System.Environment]::GetFolderPath('Desktop')

# Lire le nom de l'application depuis la config si disponible
$AppName = 'RepoScan'
$ShortcutName = $null
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ConfigPath = Join-Path $ScriptDir '..\\..\\config\\config.json'
$ExampleConfigPath = Join-Path $ScriptDir '..\\..\\config\\config.example.json'

# Créer config.json depuis config.example.json s'il n'existe pas
if (-not (Test-Path $ConfigPath) -and (Test-Path $ExampleConfigPath)) {
    try {
        Write-Host "Création de la configuration depuis config.example.json" -ForegroundColor Yellow
        Copy-Item $ExampleConfigPath $ConfigPath
        Write-Host "Configuration créée avec succès" -ForegroundColor Green
    } catch {
        Write-Host "ERREUR: Impossible de créer config.json - $($_.Exception.Message)" -ForegroundColor Red
    }
}

if (Test-Path $ConfigPath) {
    try {
        $cfg = Get-Content -Raw $ConfigPath | ConvertFrom-Json
        if ($cfg.app_name) { $AppName = [string]$cfg.app_name }
        if ($cfg.shortcut_name) { $ShortcutName = [string]$cfg.shortcut_name }
    } catch {}
}
if (-not $ShortcutName -or $ShortcutName.Trim() -eq '') { $ShortcutName = $AppName }

$ShortcutPath = Join-Path $DesktopPath ("{0}.lnk" -f $ShortcutName)

# Utiliser le dossier où se trouve ce script (compatible lorsqu'il est lancé depuis le partage UNC WSL)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BatchPath = Join-Path $ScriptDir "launch_kering_explorer.bat"
$WorkingDirectory = $ScriptDir

Write-Host "Bureau detecte: $DesktopPath" -ForegroundColor Cyan
Write-Host "Application: $AppName" -ForegroundColor Cyan
Write-Host "Raccourci: $ShortcutPath" -ForegroundColor Cyan
Write-Host "Script batch: $BatchPath" -ForegroundColor Cyan
Write-Host ""

# Demander le type de lancement
Write-Host "Choisissez le mode de lancement:" -ForegroundColor Yellow
Write-Host "1. Standard (console visible 3 secondes)" -ForegroundColor White
Write-Host "2. Silencieux (aucune console)" -ForegroundColor White
$Choice = Read-Host "Votre choix (1 ou 2)"

$SilentMode = $false
$TargetPath = $BatchPath
if ($Choice -eq "2") {
    $SilentMode = $true
    $SilentScriptPath = Join-Path $ScriptDir "launch_kering_explorer_silent.ps1"
    $TargetPath = "powershell.exe"
    $Arguments = "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"$SilentScriptPath`""
    Write-Host "Mode silencieux sélectionné" -ForegroundColor Green
    Write-Host ""
}

# Vérifier que le fichier batch existe
if (-not (Test-Path $BatchPath)) {
    Write-Host "ERREUR: Le fichier batch n'existe pas!" -ForegroundColor Red
    Write-Host "Chemin: $BatchPath" -ForegroundColor Red
    Write-Host "" 
    Write-Host "Solutions possibles:" -ForegroundColor Yellow
    Write-Host "1. Lancez ce script depuis le dossier du projet accessible en UNC (\\\\wsl.localhost\\<Distro>\\...)" -ForegroundColor Yellow
    Write-Host "2. Verifiez le chemin vers le fichier" -ForegroundColor Yellow
    Write-Host "3. Verifiez que WSL et votre distribution sont bien demarres" -ForegroundColor Yellow
    exit 1
}

# Créer l'objet COM pour le raccourci
$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)

# Configurer le raccourci selon le mode choisi
$Shortcut.TargetPath = $TargetPath
$Shortcut.WorkingDirectory = $WorkingDirectory
$Shortcut.Description = $AppName

if ($SilentMode) {
    $Shortcut.Arguments = $Arguments
    $Shortcut.WindowStyle = 7  # Fenêtre minimisée (pour PowerShell)
} else {
    $Shortcut.WindowStyle = 1  # Fenêtre normale
}

# Utiliser l'icône du terminal Windows si disponible
# Utiliser l'icône du projet si disponible, sinon fallback terminal/cmd
$ProjectIcon = Join-Path $ScriptDir "..\..\assets\icons\app_icon.ico"
if (Test-Path $ProjectIcon) {
    $Shortcut.IconLocation = $ProjectIcon
    Write-Host "Icône de l'application appliquée" -ForegroundColor Green
} else {
    $TerminalIcon = "$env:LOCALAPPDATA\Microsoft\WindowsApps\wt.exe"
    if (Test-Path $TerminalIcon) {
        $Shortcut.IconLocation = "$TerminalIcon,0"
        Write-Host "Icône Windows Terminal utilisée (fallback)" -ForegroundColor Yellow
    } else {
        # Utiliser l'icône par défaut de cmd
        $Shortcut.IconLocation = "$env:SystemRoot\System32\cmd.exe,0"
        Write-Host "Icône cmd utilisée (fallback)" -ForegroundColor Yellow
    }
}

# Sauvegarder le raccourci
try {
    $Shortcut.Save()
    Write-Host ""
    Write-Host "SUCCESS: Raccourci cree sur le bureau!" -ForegroundColor Green
    Write-Host ("Nom: {0}.lnk" -f $ShortcutName) -ForegroundColor Green
    Write-Host ""
    Write-Host "Vous pouvez maintenant double-cliquer sur le raccourci" -ForegroundColor Cyan
    Write-Host ("pour lancer {0}!" -f $AppName) -ForegroundColor Cyan
} catch {
    Write-Host ""
    Write-Host "ERREUR: Impossible de creer le raccourci" -ForegroundColor Red
    Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Appuyez sur une touche pour fermer..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")