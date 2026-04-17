@echo off
setlocal ENABLEEXTENSIONS ENABLEDELAYEDEXPANSION

REM CMD ne supporte pas les chemins UNC comme repertoire courant
cd /d "%TEMP%" >nul 2>&1

REM ─── Determiner le chemin Linux du projet ────────────────────────────────────
set "WIN_DIR=%~dp0"
if "!WIN_DIR:~-1!"=="\" set "WIN_DIR=!WIN_DIR:~0,-1!"

set "LINUX_PATH="
set "WSL_DISTRO="

REM Chemin UNC WSL : \\wsl.localhost\Ubuntu-22.04\home\user\...
echo !WIN_DIR! | findstr /B "\\\\wsl" >nul 2>&1
if not errorlevel 1 (
    set "_p=!WIN_DIR:~2!"
    for /f "tokens=1,* delims=\" %%A in ("!_p!") do set "_p2=%%B"
    for /f "tokens=1,* delims=\" %%A in ("!_p2!") do (
        set "WSL_DISTRO=%%A"
        set "_lraw=%%B"
    )
    set "LINUX_PATH=/!_lraw:\=/!"
) else (
    REM Chemin Windows natif : C:\... -> convertir via wslpath
    for /f "usebackq tokens=*" %%P in (`wsl.exe wslpath -u "!WIN_DIR!"`) do set "LINUX_PATH=%%P"
)

if not defined LINUX_PATH (
    echo Erreur : impossible de determiner le chemin du projet.
    echo Verifiez que WSL2 est installe et fonctionnel.
    pause & exit /b 1
)

REM Surcharger la distro depuis config/config.json si disponible
set "CONFIG_WIN=!WIN_DIR!\config\config.json"
if exist "!CONFIG_WIN!" (
    for /f "usebackq tokens=*" %%D in (`powershell -NoProfile -Command "try{(Get-Content -Raw '!CONFIG_WIN!' | ConvertFrom-Json).windows.distro}catch{''}"`) do (
        if not "%%D"=="" set "WSL_DISTRO=%%D"
    )
)

REM ─── Choisir le mode de lancement ────────────────────────────────────────────
REM  - Premier lancement (pas de .setup_done) : ouvre un terminal visible
REM    pour installer les dependances et configurer l'app.
REM    La fenetre se ferme automatiquement quand tout est pret.
REM  - Lancements suivants : completement silencieux, GUI s'ouvre directement.

set "SETUP_MARKER=!WIN_DIR!\config\.setup_done"

if exist "!SETUP_MARKER!" (
    REM ── Lancement silencieux ──────────────────────────────────────────────
    if defined WSL_DISTRO (
        start /B wsl.exe -d !WSL_DISTRO! -- bash -lc "cd '!LINUX_PATH!' && bash scripts/linux/launch_explorer.sh"
    ) else (
        start /B wsl.exe -- bash -lc "cd '!LINUX_PATH!' && bash scripts/linux/launch_explorer.sh"
    )
    timeout /t 2 >nul
    exit

) else (
    REM ── Premier lancement : terminal visible pour le setup ────────────────
    REM Essayer Windows Terminal (wt.exe) en priorite - plus moderne
    where wt.exe >nul 2>&1
    if not errorlevel 1 (
        if defined WSL_DISTRO (
            wt.exe wsl.exe -d !WSL_DISTRO! -- bash -lc "cd '!LINUX_PATH!' && bash scripts/linux/launch_explorer.sh"
        ) else (
            wt.exe wsl.exe -- bash -lc "cd '!LINUX_PATH!' && bash scripts/linux/launch_explorer.sh"
        )
    ) else (
        REM Fallback : cmd classique
        if defined WSL_DISTRO (
            start "RepoScan - Configuration" wsl.exe -d !WSL_DISTRO! -- bash -lc "cd '!LINUX_PATH!' && bash scripts/linux/launch_explorer.sh"
        ) else (
            start "RepoScan - Configuration" wsl.exe -- bash -lc "cd '!LINUX_PATH!' && bash scripts/linux/launch_explorer.sh"
        )
    )
    exit
)
