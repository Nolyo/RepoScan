@echo off
setlocal ENABLEEXTENSIONS ENABLEDELAYEDEXPANSION

REM Forcer un repertoire local : CMD ne supporte pas les chemins UNC comme CWD
cd /d "%TEMP%" >nul 2>&1

set "APP_NAME=RepoScan"
set "LogFile=%TEMP%\RepoScan_launch.log"
echo [%DATE% %TIME%] Lancement > "!LogFile!"

REM ─── Determiner le chemin Linux du projet ─────────────────────────────────
REM Cas 1 : lance depuis %LOCALAPPDATA%\RepoScan\ (raccourci bureau)
REM         -> config.json est a cote de ce .bat
REM Cas 2 : lance directement depuis \\wsl.localhost\... (projet WSL)
REM         -> config.json est dans ..\..\config\config.json

set "WIN_DIR=%~dp0"
if "!WIN_DIR:~-1!"=="\" set "WIN_DIR=!WIN_DIR:~0,-1!"

set "LINUX_PATH="
set "WSL_DISTRO=Ubuntu"

REM Priorite 1 : config.json local (raccourci bureau - LOCALAPPDATA)
set "LocalConfig=!WIN_DIR!\config.json"

REM Priorite 2 : config.json racine projet (lancement depuis scripts\windows\)
set "ProjectConfig=!WIN_DIR!\..\..\config\config.json"

REM Choisir la config disponible
set "SourceConfig="
if exist "!LocalConfig!" (
    set "SourceConfig=!LocalConfig!"
) else if exist "!ProjectConfig!" (
    set "SourceConfig=!ProjectConfig!"
)

if defined SourceConfig (
    for /f "usebackq tokens=*" %%I in (`powershell -NoProfile -Command "try{(Get-Content -Raw '!SourceConfig!' | ConvertFrom-Json).app_name}catch{''}"`) do if not "%%I"=="" set "APP_NAME=%%I"
    for /f "usebackq tokens=*" %%I in (`powershell -NoProfile -Command "try{(Get-Content -Raw '!SourceConfig!' | ConvertFrom-Json).windows.distro}catch{''}"`) do if not "%%I"=="" set "WSL_DISTRO=%%I"
    for /f "usebackq tokens=*" %%I in (`powershell -NoProfile -Command "try{(Get-Content -Raw '!SourceConfig!' | ConvertFrom-Json).windows.linux_project_path}catch{''}"`) do if not "%%I"=="" set "LINUX_PATH=%%I"
    echo Config: !SourceConfig! >> "!LogFile!"
)

REM Si linux_project_path n'est pas dans la config, le deduire du chemin UNC
if not defined LINUX_PATH (
    echo !WIN_DIR! | findstr /B "\\\\wsl" >nul 2>&1
    if not errorlevel 1 (
        set "_p=!WIN_DIR:~2!"
        for /f "tokens=1,* delims=\" %%A in ("!_p!") do set "_p2=%%B"
        for /f "tokens=1,* delims=\" %%A in ("!_p2!") do (
            if "!WSL_DISTRO!"=="Ubuntu" set "WSL_DISTRO=%%A"
            set "_lraw=%%B"
        )
        REM scripts\windows est 2 niveaux sous la racine -> remonter de 2
        for /f "tokens=1,* delims=\" %%A in ("!_lraw!") do set "_l1=%%A\%%B"
        REM Supprimer les 2 derniers composants (scripts\windows)
        set "LINUX_PATH=/!_lraw:\=/!"
        REM Retirer /scripts/windows de la fin
        set "LINUX_PATH=!LINUX_PATH:/scripts/windows=!"
    ) else (
        set "LINUX_PATH=~/www/RepoScan"
    )
)

title !APP_NAME!
echo Distro: !WSL_DISTRO! >> "!LogFile!"
echo Chemin: !LINUX_PATH! >> "!LogFile!"

start /B wsl.exe -d !WSL_DISTRO! -- bash -lc "cd '!LINUX_PATH!' && bash ./scripts/linux/launch_explorer.sh"

timeout /t 2 >nul
echo [%DATE% %TIME%] Lance en arriere-plan >> "!LogFile!" 2>nul
echo L'application !APP_NAME! se lance en arriere-plan...
echo Cette console va se fermer automatiquement dans 3 secondes.

timeout /t 3 >nul 2>nul
exit
