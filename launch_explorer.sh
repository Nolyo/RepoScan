#!/bin/bash

# Se placer dans le répertoire du script pour que les chemins relatifs fonctionnent
cd "$(dirname "$0")" || exit

# Vérifier si Python3 est installé
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Vérifier si tkinter est disponible ET si un display est présent (WSLg/Wayland/X11)
if python3 -c "import tkinter" &>/dev/null; then
    if [ -n "$WAYLAND_DISPLAY" ] || [ -n "$DISPLAY" ]; then
        echo "🚀 Lancement de GitHub Repository Explorer (Interface Graphique)..."
        # Lancer en premier-plan pour remonter les erreurs dans le log Windows
        python3 github_repo_explorer.py
        exit $?
    else
        echo "⚠️  Aucun display graphique détecté (WSLg/Wayland/X11 absent)."
        echo "   Bascule en mode console."
    fi
else
    echo "⚠️  tkinter n'est pas disponible. Lancement de la version console..."
    echo "   Pour installer tkinter: sudo apt-get install python3-tk"
    echo ""
fi

python3 console_repo_explorer.py