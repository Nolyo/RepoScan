# Script PowerShell pour créer un raccourci sur le bureau
# GitHub Repository Explorer - Kering

Write-Host "=== Creation du raccourci bureau ===" -ForegroundColor Green
Write-Host ""

# Chemins
$DesktopPath = [System.Environment]::GetFolderPath('Desktop')
$ShortcutPath = Join-Path $DesktopPath "Kering Repo Explorer.lnk"
$BatchPath = "\\wsl.localhost\Ubuntu\home\yjaffres\www\kering\pytool\launch_kering_explorer.bat"
$WorkingDirectory = "\\wsl.localhost\Ubuntu\home\yjaffres\www\kering\pytool"

Write-Host "Bureau detecte: $DesktopPath" -ForegroundColor Cyan
Write-Host "Raccourci: $ShortcutPath" -ForegroundColor Cyan
Write-Host "Script batch: $BatchPath" -ForegroundColor Cyan
Write-Host ""

# Vérifier que le fichier batch existe
if (-not (Test-Path $BatchPath)) {
    Write-Host "ERREUR: Le fichier batch n'existe pas!" -ForegroundColor Red
    Write-Host "Chemin: $BatchPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "Solutions possibles:" -ForegroundColor Yellow
    Write-Host "1. Verifiez que WSL Ubuntu est lance" -ForegroundColor Yellow
    Write-Host "2. Verifiez le chemin vers le fichier" -ForegroundColor Yellow
    Write-Host "3. Essayez de copier manuellement le fichier .bat vers Windows" -ForegroundColor Yellow
    exit 1
}

# Créer l'objet COM pour le raccourci
$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)

# Configurer le raccourci
$Shortcut.TargetPath = $BatchPath
$Shortcut.WorkingDirectory = $WorkingDirectory
$Shortcut.Description = "GitHub Repository Explorer - Kering Projects"
$Shortcut.WindowStyle = 1  # Fenêtre normale

# Utiliser l'icône du terminal Windows si disponible
$TerminalIcon = "$env:LOCALAPPDATA\Microsoft\WindowsApps\wt.exe"
if (Test-Path $TerminalIcon) {
    $Shortcut.IconLocation = "$TerminalIcon,0"
    Write-Host "Icone Windows Terminal utilisee" -ForegroundColor Green
} else {
    # Utiliser l'icône par défaut de cmd
    $Shortcut.IconLocation = "$env:SystemRoot\System32\cmd.exe,0"
    Write-Host "Icone cmd utilisee" -ForegroundColor Yellow
}

# Sauvegarder le raccourci
try {
    $Shortcut.Save()
    Write-Host ""
    Write-Host "SUCCESS: Raccourci cree sur le bureau!" -ForegroundColor Green
    Write-Host "Nom: Kering Repo Explorer.lnk" -ForegroundColor Green
    Write-Host ""
    Write-Host "Vous pouvez maintenant double-cliquer sur le raccourci" -ForegroundColor Cyan
    Write-Host "pour lancer GitHub Repository Explorer!" -ForegroundColor Cyan
} catch {
    Write-Host ""
    Write-Host "ERREUR: Impossible de creer le raccourci" -ForegroundColor Red
    Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Appuyez sur une touche pour fermer..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")