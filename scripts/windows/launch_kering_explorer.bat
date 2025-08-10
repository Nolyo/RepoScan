@echo off
REM Lanceur de l'application (nom dynamique via config)
REM Ce script lance l'application depuis Windows vers WSL

set "APP_NAME=Git Repo Explorer"

setlocal ENABLEEXTENSIONS ENABLEDELAYEDEXPANSION

REM Dossier du script (ou ce .bat est situe)
set "ScriptDir=%~dp0"
set "LogFile=%ScriptDir%launch.log"
echo [%DATE% %TIME%] Lancement du Repo Explorer > "%LogFile%"

REM Valeurs par defaut si pas de config
set "WSL_DISTRO=Ubuntu"
set "LINUX_PROJECT_PATH=~/www/pytool"

REM Creer config.json depuis config.example.json s'il n'existe pas
if not exist "%ScriptDir%config.json" (
    echo Configuration manquante, creation depuis config.example.json >> "%LogFile%"
    REM Le config.json devrait etre cree par le script d'installation
    REM Si on arrive ici, c'est probablement un lancement direct
    echo ATTENTION: config.json manquant >> "%LogFile%"
)

REM Lire config.json (app_name et section windows) si present
if exist "%ScriptDir%config.json" (
  for /f "usebackq tokens=* delims=" %%I in (`powershell -NoProfile -Command "try{(Get-Content -Raw '%ScriptDir%config.json' | ConvertFrom-Json).app_name}catch{''}"`) do if not "%%I"=="" set "APP_NAME=%%I"
  for /f "usebackq tokens=* delims=" %%I in (`powershell -NoProfile -Command "try{(Get-Content -Raw '%ScriptDir%config.json' | ConvertFrom-Json).windows.distro}catch{''}"`) do if not "%%I"=="" set "WSL_DISTRO=%%I"
  for /f "usebackq tokens=* delims=" %%I in (`powershell -NoProfile -Command "try{(Get-Content -Raw '%ScriptDir%config.json' | ConvertFrom-Json).windows.linux_project_path}catch{''}"`) do if not "%%I"=="" set "LINUX_PROJECT_PATH=%%I"
)

title %APP_NAME%

echo Lancement de %APP_NAME% sur %WSL_DISTRO% ... >> "%LogFile%"

REM Lancer le script dans un shell de connexion WSL et se placer dans le dossier du projet
echo Lancement en arriere-plan... >> "%LogFile%"

REM Lancer WSL en arriere-plan avec start /B pour ne pas bloquer la console
start /B wsl.exe -d %WSL_DISTRO% -- bash -lc "cd \"%LINUX_PROJECT_PATH%\" && bash ./scripts/linux/launch_explorer.sh" 

REM Attendre un court delai pour permettre le lancement
timeout /t 2 >nul

echo [%DATE% %TIME%] Application lancee en arriere-plan >> "%LogFile%" 2>nul
echo L'application %APP_NAME% se lance en arriere-plan...
echo Cette console va se fermer automatiquement dans 3 secondes.
echo.

REM Fermer automatiquement la console apres 3 secondes (meme en cas d'erreur)
timeout /t 3 >nul 2>nul
echo Fermeture de la console...
exit

endlocal