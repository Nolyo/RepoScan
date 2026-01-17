@echo off
setlocal ENABLEEXTENSIONS ENABLEDELAYEDEXPANSION

REM Script de diagnostic pour identifier les problèmes de lancement

echo ============================================
echo    DIAGNOSTIC DE LANCEMENT - RepoScan
echo ============================================
echo.

REM Identifier le dossier du script
set "ScriptDir=%~dp0"
echo Dossier du script: %ScriptDir%

REM Vérifier les fichiers essentiels
echo.
echo === VERIFICATION DES FICHIERS ===
set "ConfigFile=%ScriptDir%config.json"
set "LauncherBat=%ScriptDir%launch_kering_explorer.bat"

if exist "%ConfigFile%" (
    echo [OK] config.json trouvé: %ConfigFile%
) else (
    echo [ERREUR] config.json manquant: %ConfigFile%
)

if exist "%LauncherBat%" (
    echo [OK] launch_kering_explorer.bat trouvé: %LauncherBat%
) else (
    echo [ERREUR] launch_kering_explorer.bat manquant: %LauncherBat%
)

REM Lire la configuration
echo.
echo === CONFIGURATION ACTUELLE ===
if exist "%ConfigFile%" (
    for /f "usebackq tokens=* delims=" %%I in (`powershell -NoProfile -Command "try{(Get-Content -Raw '%ConfigFile%' | ConvertFrom-Json).windows.distro}catch{'ERREUR'}"`) do set "WSL_DISTRO=%%I"
    for /f "usebackq tokens=* delims=" %%I in (`powershell -NoProfile -Command "try{(Get-Content -Raw '%ConfigFile%' | ConvertFrom-Json).windows.linux_project_path}catch{'ERREUR'}"`) do set "LINUX_PROJECT_PATH=%%I"
    
    echo Distribution WSL: %WSL_DISTRO%
    echo Chemin Linux: %LINUX_PROJECT_PATH%
) else (
    echo Configuration par défaut:
    set "WSL_DISTRO=Ubuntu"
    set "LINUX_PROJECT_PATH=~/www/repo-scan"
    echo Distribution WSL: %WSL_DISTRO%
    echo Chemin Linux: %LINUX_PROJECT_PATH%
)

REM Tester WSL
echo.
echo === TEST WSL ===
wsl.exe --list --quiet 2>nul | findstr /i "%WSL_DISTRO%" >nul
if %ERRORLEVEL% equ 0 (
    echo [OK] Distribution WSL '%WSL_DISTRO%' trouvée
) else (
    echo [ERREUR] Distribution WSL '%WSL_DISTRO%' non trouvée
    echo Distributions disponibles:
    wsl.exe --list --quiet
)

REM Tester l'accès au chemin Linux
echo.
echo === TEST CHEMIN LINUX ===
echo Test d'accès au chemin: %LINUX_PROJECT_PATH%
wsl.exe -d %WSL_DISTRO% -- bash -c "if [ -d '%LINUX_PROJECT_PATH%' ]; then echo '[OK] Dossier trouvé'; else echo '[ERREUR] Dossier non trouvé'; fi" 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERREUR] Impossible d'accéder à WSL ou au chemin spécifié
)

REM Tester l'accès au script de lancement Linux
echo.
echo === TEST SCRIPT LINUX ===
set "LinuxScript=%LINUX_PROJECT_PATH%/scripts/linux/launch_explorer.sh"
echo Test du script: %LinuxScript%
wsl.exe -d %WSL_DISTRO% -- bash -c "if [ -f '%LinuxScript%' ]; then echo '[OK] Script trouvé'; else echo '[ERREUR] Script non trouvé'; fi" 2>nul

REM Tester Python dans WSL
echo.
echo === TEST PYTHON ===
wsl.exe -d %WSL_DISTRO% -- bash -c "cd '%LINUX_PROJECT_PATH%' 2>/dev/null && python3 --version" 2>nul
if %ERRORLEVEL% equ 0 (
    echo [OK] Python3 accessible
) else (
    echo [ERREUR] Python3 non accessible dans WSL
)

echo.
echo === TENTATIVE DE LANCEMENT ===
echo Appuyez sur une touche pour tenter le lancement (ou Ctrl+C pour annuler)
pause >nul

echo Lancement en cours...
wsl.exe -d %WSL_DISTRO% -- bash -lc "cd '%LINUX_PROJECT_PATH%' && bash ./scripts/linux/launch_explorer.sh"

echo.
echo Appuyez sur une touche pour fermer...
pause >nul