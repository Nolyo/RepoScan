@echo off
REM Script pour configurer le raccourci bureau
REM GitHub Repository Explorer - Kering

title Configuration du raccourci - Kering Repo Explorer

color 0B
echo.
echo ================================================
echo    Configuration du raccourci bureau
echo    GitHub Repository Explorer - Kering
echo ================================================
echo.

REM Créer le dossier dans AppData si nécessaire
set "AppFolder=%LOCALAPPDATA%\KeringRepoExplorer"
if not exist "%AppFolder%" (
    echo Creation du dossier application...
    mkdir "%AppFolder%"
)

REM Copier le script batch vers Windows
echo Copie du lanceur...
copy "\\wsl.localhost\Ubuntu\home\yjaffres\www\kering\pytool\launch_kering_explorer.bat" "%AppFolder%\"

if errorlevel 1 (
    echo.
    echo ERREUR: Impossible de copier le fichier depuis WSL
    echo.
    echo Solutions:
    echo 1. Assurez-vous que WSL Ubuntu est demarre
    echo 2. Verifiez que le chemin existe
    echo 3. Essayez de copier manuellement le fichier
    echo.
    pause
    exit /b 1
)

REM Créer le raccourci sur le bureau avec PowerShell
echo Creation du raccourci sur le bureau...
powershell -Command "& {$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\Kering Repo Explorer.lnk'); $Shortcut.TargetPath = '%AppFolder%\launch_kering_explorer.bat'; $Shortcut.WorkingDirectory = '%AppFolder%'; $Shortcut.Description = 'GitHub Repository Explorer - Kering Projects'; $Shortcut.IconLocation = '%SystemRoot%\System32\shell32.dll,4'; $Shortcut.Save()}"

if %errorlevel% equ 0 (
    echo.
    echo ================================================
    echo            INSTALLATION REUSSIE!
    echo ================================================
    echo.
    echo Le raccourci "Kering Repo Explorer" a ete cree
    echo sur votre bureau.
    echo.
    echo Double-cliquez dessus pour lancer l'application!
    echo.
) else (
    echo.
    echo ERREUR: Impossible de creer le raccourci
    echo Essayez de creer manuellement le raccourci vers:
    echo %AppFolder%\launch_kering_explorer.bat
    echo.
)

echo Appuyez sur une touche pour fermer...
pause >nul