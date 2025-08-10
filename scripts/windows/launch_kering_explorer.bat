@echo off
REM Lanceur de l'application (nom dynamique via config)
REM Ce script lance l'application depuis Windows vers WSL

set "APP_NAME=Git Repo Explorer"

setlocal ENABLEEXTENSIONS ENABLEDELAYEDEXPANSION

REM Dossier du script (où ce .bat est situé)
set "ScriptDir=%~dp0"
set "LogFile=%ScriptDir%launch.log"
echo [%DATE% %TIME%] Lancement du Repo Explorer > "%LogFile%"

REM Valeurs par defaut si pas de config
set "WSL_DISTRO=Ubuntu"
set "LINUX_PROJECT_PATH=~/www/pytool"

REM Créer config.json depuis config.example.json s'il n'existe pas
if not exist "%ScriptDir%config.json" (
    echo Configuration manquante, creation depuis config.example.json >> "%LogFile%"
    REM Le config.json devrait être créé par le script d'installation
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
wsl.exe -d %WSL_DISTRO% -- bash -lc "cd \"%LINUX_PROJECT_PATH%\" && bash ./scripts/linux/launch_explorer.sh" >> "%LogFile%" 2>>&1

set "EXITCODE=%ERRORLEVEL%"
if not "%EXITCODE%"=="0" (
  echo [%DATE% %TIME%] ERREUR: code retour WSL=%EXITCODE% >> "%LogFile%"
  echo Un probleme est survenu. Consultez le log: "%LogFile%"
  echo.
  type "%LogFile%"
  echo.
  pause
  exit /b %EXITCODE%
)

echo [%DATE% %TIME%] Terminé avec succès >> "%LogFile%"
exit /b 0

endlocal