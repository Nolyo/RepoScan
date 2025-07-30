@echo off
REM Lanceur GitHub Repository Explorer - Kering Projects
REM Ce script lance l'application depuis Windows vers WSL

title GitHub Repository Explorer - Kering

REM Couleurs pour le terminal
color 0A

echo.
echo ===============================================
echo    GitHub Repository Explorer - Kering
echo ===============================================
echo.
echo Lancement de l'application...
echo.

REM Lancer l'application dans WSL
wsl -d Ubuntu bash -c "cd /home/yjaffres/www/kering/pytool && ./launch_explorer.sh"

REM Attendre une touche avant de fermer (au cas où il y aurait une erreur)
if errorlevel 1 (
    echo.
    echo Une erreur s'est produite lors du lancement.
    echo Verifiez que WSL et Ubuntu sont installes et configures.
    echo.
    pause
)