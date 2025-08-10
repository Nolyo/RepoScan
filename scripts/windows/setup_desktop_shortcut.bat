@echo off
setlocal ENABLEEXTENSIONS ENABLEDELAYEDEXPANSION

REM Forcer le changement vers un repertoire Windows pour eviter l'erreur UNC
cd /d "%TEMP%" >nul 2>&1 || cd /d "%USERPROFILE%" >nul 2>&1 || cd /d "C:\" >nul 2>&1

REM Script pour configurer le raccourci bureau
REM RepoScan (nom dynamique via config)

set "APP_NAME=RepoScan"
set "SHORTCUT_NAME="
title Configuration du raccourci - %APP_NAME%
color 0B
echo.
echo ================================================
echo    Configuration du raccourci bureau
echo    %APP_NAME%
echo ================================================
echo.

echo [DEBUG] Chargement de la config...

REM Charger le nom depuis la config centrale si presente
set "SourceConfig=%~dp0..\..\config\config.json"
set "ExampleConfig=%~dp0..\..\config\config.example.json"

REM Creer config.json depuis config.example.json s'il n'existe pas
if not exist "%SourceConfig%" (
    if exist "%ExampleConfig%" (
        echo Creation de la configuration depuis config.example.json
        copy /Y "%ExampleConfig%" "%SourceConfig%" >nul
        if exist "%SourceConfig%" (
            echo Configuration creee avec succes
        ) else (
            echo ERREUR: Impossible de creer config.json
        )
    ) else (
        echo ERREUR: config.example.json introuvable
    )
)

if exist "%SourceConfig%" (
    for /f "usebackq tokens=* delims=" %%I in (`powershell -NoProfile -Command "try{(Get-Content -Raw '%SourceConfig%' | ConvertFrom-Json).app_name}catch{''}"`) do if not "%%I"=="" set "APP_NAME=%%I"
    for /f "usebackq tokens=* delims=" %%I in (`powershell -NoProfile -Command "try{(Get-Content -Raw '%SourceConfig%' | ConvertFrom-Json).shortcut_name}catch{''}"`) do if not "%%I"=="" set "SHORTCUT_NAME=%%I"
)

if "%SHORTCUT_NAME%"=="" set "SHORTCUT_NAME=%APP_NAME%"

echo [DEBUG] APP_NAME="%APP_NAME%"
echo [DEBUG] SHORTCUT_NAME="%SHORTCUT_NAME%"
echo [DEBUG] Appel de la fonction CleanAppName...

REM Nettoyage legacy: dossiers de versions precedentes
if exist "%LOCALAPPDATA%\KeringRepoExplorer" (
    echo Suppression du dossier legacy KeringRepoExplorer...
    rmdir /s /q "%LOCALAPPDATA%\KeringRepoExplorer" >nul 2>&1
)

REM Simple : remplacer les espaces par des underscores pour le nom de dossier
set "CleanAppName=%APP_NAME: =_%"
echo [DEBUG] CleanAppName="%CleanAppName%"
set "AppFolder=%LOCALAPPDATA%\%CleanAppName%"
echo [DEBUG] AppFolder="%AppFolder%"
set "LogFile=%AppFolder%\setup.log"
REM Resoudre dynamiquement le dossier Bureau (compatible OneDrive/redirect)
for /f "usebackq delims=" %%D in (`powershell -NoProfile -Command "[Environment]::GetFolderPath('Desktop')"`) do set "DesktopDir=%%D"
if not defined DesktopDir set "DesktopDir=%USERPROFILE%\Desktop"
set "ShortcutPath=%DesktopDir%\%SHORTCUT_NAME%.lnk"
if not exist "%AppFolder%" (
    echo Creation du dossier application...
    mkdir "%AppFolder%"
)

echo [%DATE% %TIME%] Debut installation > "%LogFile%"
echo Script lance depuis : %~dp0 >> "%LogFile%"
echo Dossier application  : %AppFolder% >> "%LogFile%"
echo Nom application      : %APP_NAME% >> "%LogFile%"
echo Nom raccourci        : %SHORTCUT_NAME% >> "%LogFile%"
echo Raccourci cible      : %ShortcutPath% >> "%LogFile%"

REM Copier le script batch depuis le dossier courant du script
echo Copie du lanceur (ecrasement force)
del /Q "%AppFolder%\launch_kering_explorer.bat" >nul 2>&1
copy /Y "%~dp0launch_kering_explorer.bat" "%AppFolder%\" >nul 2>&1
echo Verification de la copie >> "%LogFile%"
copy /Y "%~dp0launch_kering_explorer.bat" "%AppFolder%\" >> "%LogFile%" 2>>&1
IF NOT EXIST "%AppFolder%\launch_kering_explorer.bat" (
    echo.
    echo ERREUR: Impossible de copier le fichier depuis WSL
    echo ERREUR: Impossible de copier le fichier depuis WSL >> "%LogFile%"
    echo.
    echo Solutions:
    echo 1. Assurez-vous que WSL Ubuntu est demarre
    echo 2. Verifiez que vous avez lance ce script depuis le dossier du projet
    echo 3. Essayez de copier manuellement le fichier depuis %~dp0 vers %AppFolder%
    echo.
    pause
    exit /b 1
)

REM Copier la configuration centralisee si presente (config/config.json)
if exist "%SourceConfig%" (
    echo Copie de la configuration (config.json)
    copy /Y "%SourceConfig%" "%AppFolder%\" >nul 2>&1 & copy /Y "%SourceConfig%" "%AppFolder%\" >> "%LogFile%" 2>>&1
) else (
    echo ATTENTION: config.json introuvable a l'emplacement attendu: %SourceConfig% >> "%LogFile%"
)

REM Copier l'icone de l'application si disponible
set "SourceIcon=%~dp0..\..\assets\icons\app_icon.ico"
if exist "%SourceIcon%" (
    echo Copie de l'icone de l'application (app_icon.ico)
    copy /Y "%SourceIcon%" "%AppFolder%\app_icon.ico" >nul 2>&1
    copy /Y "%SourceIcon%" "%AppFolder%\app_icon.ico" >> "%LogFile%" 2>>&1
) else (
    echo ATTENTION: app_icon.ico introuvable a l'emplacement attendu: %SourceIcon% >> "%LogFile%"
)

REM (Ancien support win_config.json supprime)

REM Demander le mode de lancement
echo.
echo Choisissez le mode de lancement:
echo 1. Standard (console visible 3 secondes)
echo 2. Silencieux (aucune console)
set /p "LaunchMode=Votre choix (1 ou 2): "

if "%LaunchMode%"=="2" (
    set "SilentMode=true"
    echo Mode silencieux selectionne
) else (
    set "SilentMode=false"
    echo Mode standard selectionne
)
echo.

REM Copier le script silencieux si n�cessaire
if "%SilentMode%"=="true" (
    echo Copie du lanceur silencieux
    copy /Y "%~dp0launch_kering_explorer_silent.ps1" "%AppFolder%\" >nul 2>&1
    if not exist "%AppFolder%\launch_kering_explorer_silent.ps1" (
        echo ERREUR: Impossible de copier le script silencieux
        set "SilentMode=false"
        echo Utilisation du mode standard par defaut
    )
)

REM Cr�er le raccourci sur le bureau avec PowerShell
echo Creation du raccourci sur le bureau
echo Generation du script PowerShell temporaire >> "%LogFile%"
set "TmpPs1=%TEMP%\kering_create_shortcut.ps1"
del /Q "%TmpPs1%" >nul 2>&1
echo $ErrorActionPreference = 'Stop'>>"%TmpPs1%"
echo $WshShell = New-Object -ComObject WScript.Shell>>"%TmpPs1%"
echo $desktop = [Environment]::GetFolderPath('Desktop')>>"%TmpPs1%"
echo if (-not (Test-Path -LiteralPath $desktop)) { throw "Desktop folder not found: $desktop" }>>"%TmpPs1%"
echo $lnkPath = Join-Path $desktop '%SHORTCUT_NAME%.lnk'>>"%TmpPs1%"
echo $Shortcut = $WshShell.CreateShortcut($lnkPath)>>"%TmpPs1%"

if "%SilentMode%"=="true" (
    echo $Shortcut.TargetPath = 'powershell.exe'>>"%TmpPs1%"
    echo $Shortcut.Arguments = '-WindowStyle Hidden -ExecutionPolicy Bypass -File "%AppFolder%\launch_kering_explorer_silent.ps1"'>>"%TmpPs1%"
    echo $Shortcut.WindowStyle = 7>>"%TmpPs1%"
) else (
    REM Mode standard : creer un script PowerShell intermediaire pour eviter les problemes de guillemets
    set "LauncherPs1=%AppFolder%\launch_with_feedback.ps1"
    echo Write-Host "Lancement de %APP_NAME%..." > "%AppFolder%\launch_with_feedback.ps1"
    echo Start-Process -FilePath "%AppFolder%\launch_kering_explorer.bat" -WindowStyle Hidden >> "%AppFolder%\launch_with_feedback.ps1"
    echo Write-Host "Application lancee en arriere-plan" >> "%AppFolder%\launch_with_feedback.ps1"
    echo Start-Sleep -Seconds 3 >> "%AppFolder%\launch_with_feedback.ps1"
    echo Write-Host "Fermeture automatique..." >> "%AppFolder%\launch_with_feedback.ps1"
    echo $Shortcut.TargetPath = 'powershell.exe'>>"%TmpPs1%"
    echo $Shortcut.Arguments = '-ExecutionPolicy Bypass -File "%AppFolder%\launch_with_feedback.ps1"'>>"%TmpPs1%"
    echo $Shortcut.WindowStyle = 1>>"%TmpPs1%"
)

echo $Shortcut.WorkingDirectory = '%AppFolder%'>>"%TmpPs1%"
echo $Shortcut.Description = '%APP_NAME%'>>"%TmpPs1%"
echo $iconPath = Join-Path '%AppFolder%' 'app_icon.ico'>>"%TmpPs1%"
echo if (Test-Path -LiteralPath $iconPath) { $Shortcut.IconLocation = $iconPath } else { $Shortcut.IconLocation = "$env:SystemRoot\System32\shell32.dll,4" }>>"%TmpPs1%"
echo $Shortcut.Save()>>"%TmpPs1%"

if not exist "%TmpPs1%" (
    echo ERREUR: Le script temporaire PowerShell n'a pas ete cree >> "%LogFile%"
    echo ERREUR: Le script temporaire PowerShell n'a pas ete cree
    echo Emplacement attendu: %TmpPs1%
    pause
    exit /b 1
)

echo Execution du script PowerShell: %TmpPs1% >> "%LogFile%"
echo Verif existence script: %TmpPs1% >> "%LogFile%"
if exist "%TmpPs1%" (
    echo OK: script present >> "%LogFile%"
) else (
    echo ERREUR: script absent juste avant execution >> "%LogFile%"
)
powershell -NoProfile -Command "Write-Host 'PS Test-Path:' (Test-Path -LiteralPath '%TmpPs1%')" >> "%LogFile%" 2>>&1
powershell -NoProfile -ExecutionPolicy Bypass -File "%TmpPs1%" >> "%LogFile%" 2>>&1
set "PS_EXITCODE=%ERRORLEVEL%"
del /Q "%TmpPs1%" >nul 2>&1

REM Fallback: si le raccourci n'existe pas, reessayer via -Command inline
if not exist "%ShortcutPath%" (
    echo Fallback: tentative creation inline PowerShell >> "%LogFile%"
    if "%SilentMode%"=="true" (
        powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $desktop=[Environment]::GetFolderPath('Desktop'); if (-not (Test-Path -LiteralPath $desktop)) { throw 'Desktop not found' }; $ws=New-Object -ComObject WScript.Shell; $lnk=Join-Path $desktop '%SHORTCUT_NAME%.lnk'; $sc=$ws.CreateShortcut($lnk); $sc.TargetPath='powershell.exe'; $sc.Arguments='-WindowStyle Hidden -ExecutionPolicy Bypass -File \"%AppFolder%\launch_kering_explorer_silent.ps1\"'; $sc.WorkingDirectory='%AppFolder%'; $sc.Description='%APP_NAME%'; $sc.IconLocation='%AppFolder%\app_icon.ico'; $sc.WindowStyle=7; $sc.Save(); exit 0 } catch { Write-Host $_.Exception.Message; exit 1 }" >> "%LogFile%" 2>>&1
    ) else (
        powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $desktop=[Environment]::GetFolderPath('Desktop'); if (-not (Test-Path -LiteralPath $desktop)) { throw 'Desktop not found' }; $ws=New-Object -ComObject WScript.Shell; $lnk=Join-Path $desktop '%SHORTCUT_NAME%.lnk'; $sc=$ws.CreateShortcut($lnk); $sc.TargetPath='powershell.exe'; $sc.Arguments='-ExecutionPolicy Bypass -File \"%AppFolder%\launch_with_feedback.ps1\"'; $sc.WorkingDirectory='%AppFolder%'; $sc.Description='%APP_NAME%'; $sc.IconLocation='%AppFolder%\app_icon.ico'; $sc.Save(); exit 0 } catch { Write-Host $_.Exception.Message; exit 1 }" >> "%LogFile%" 2>>&1
    )
)

if exist "%ShortcutPath%" (
    echo.
    echo ================================================
    echo            INSTALLATION REUSSIE!
    echo ================================================
    echo.
    echo Le raccourci "%SHORTCUT_NAME%" a ete cree
    echo sur votre bureau.
    echo.
    echo Double-cliquez dessus pour lancer l'application!
    echo.
    echo [%DATE% %TIME%] Raccourci cree avec succes >> "%LogFile%"
) else (
    echo.
    echo ERREUR: Impossible de creer le raccourci
    echo Essayez de creer manuellement le raccourci vers: 
    echo    %AppFolder%\launch_kering_explorer.bat
    echo Consultez le log pour plus de details:
    echo    %LogFile%
    echo Code retour PowerShell: !PS_EXITCODE! >> "%LogFile%"
    echo ERREUR: Le raccourci n'existe pas apres creation >> "%LogFile%"
    echo.
)

echo Appuyez sur une touche pour fermer...
pause >nul
