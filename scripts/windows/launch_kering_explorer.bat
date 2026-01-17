@echo off

REM Lanceur de l'application (nom dynamique via config)

REM Ce script lance l'application depuis Windows vers WSL



set "APP_NAME=RepoScan"



setlocal ENABLEEXTENSIONS ENABLEDELAYEDEXPANSION



REM Dossier du script (ou ce .bat est situe)

set "ScriptDir=%~dp0"

set "LogFile=%ScriptDir%launch.log"

echo [%DATE% %TIME%] Lancement du Repo Explorer > "%LogFile%"



REM Valeurs par defaut si pas de config

set "WSL_DISTRO=Ubuntu"

set "LINUX_PROJECT_PATH=~/www/repo-scan"



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



REM Validation avant lancement
echo === DIAGNOSTIC DE LANCEMENT === >> "%LogFile%"

REM Tester si WSL et la distribution sont disponibles
wsl.exe --list --quiet 2>nul | findstr /i "%WSL_DISTRO%" >nul
if %ERRORLEVEL% neq 0 (
    echo ERREUR: Distribution WSL '%WSL_DISTRO%' non trouvée >> "%LogFile%"
    echo.
    echo ❌ ERREUR: Distribution WSL '%WSL_DISTRO%' non trouvée
    echo.
    echo Solutions:
    echo 1. Installer WSL: wsl --install
    echo 2. Installer Ubuntu: wsl --install -d Ubuntu  
    echo 3. Vérifier les distributions: wsl --list
    echo.
    echo Appuyez sur une touche pour fermer...
    pause >nul
    exit /b 1
)

REM Tester l'accès au chemin Linux
echo Test d'accès au chemin: %LINUX_PROJECT_PATH% >> "%LogFile%"
wsl.exe -d %WSL_DISTRO% -- bash -c "if [ -d '%LINUX_PROJECT_PATH%' ]; then echo 'OK'; else echo 'ERREUR'; fi" 2>>"%LogFile%" | findstr "ERREUR" >nul
if %ERRORLEVEL% equ 0 (
    echo ERREUR: Chemin Linux '%LINUX_PROJECT_PATH%' non trouvé >> "%LogFile%"
    echo.
    echo ❌ ERREUR: Chemin Linux '%LINUX_PROJECT_PATH%' non trouvé
    echo.
    echo Solutions:
    echo 1. Vérifier que le projet est bien cloné à cet emplacement dans WSL
    echo 2. Modifier le chemin dans: %ScriptDir%config.json
    echo 3. Voir la section "windows" ^> "linux_project_path"
    echo.
    echo Appuyez sur une touche pour fermer...
    pause >nul
    exit /b 1
)

REM Tester le script de lancement Linux
set "LaunchScript=%LINUX_PROJECT_PATH%/scripts/linux/launch_explorer.sh"
wsl.exe -d %WSL_DISTRO% -- bash -c "if [ -f '%LaunchScript%' ]; then echo 'OK'; else echo 'ERREUR'; fi" 2>>"%LogFile%" | findstr "ERREUR" >nul
if %ERRORLEVEL% equ 0 (
    echo ERREUR: Script de lancement non trouvé: %LaunchScript% >> "%LogFile%"
    echo.
    echo ❌ ERREUR: Script de lancement non trouvé
    echo   %LaunchScript%
    echo.
    echo Vérifiez que le projet est complet et bien cloné.
    echo.
    echo Appuyez sur une touche pour fermer...
    pause >nul
    exit /b 1
)

echo Toutes les validations sont OK, lancement... >> "%LogFile%"

REM Lancer WSL en arriere-plan avec start /B pour ne pas bloquer la console
echo Lancement de la commande WSL... >> "%LogFile%"
start /B wsl.exe -d %WSL_DISTRO% -- bash -lc "cd '%LINUX_PROJECT_PATH%' && bash ./scripts/linux/launch_explorer.sh" 

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
