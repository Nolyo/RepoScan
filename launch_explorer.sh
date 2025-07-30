#!/bin/bash

# Vérifier si Python3 est installé
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Vérifier si tkinter est disponible
python3 -c "import tkinter" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "🚀 Lancement de GitHub Repository Explorer (Interface Graphique)..."
    python3 "$(dirname "$0")/github_repo_explorer.py"
else
    echo "⚠️  tkinter n'est pas disponible. Lancement de la version console..."
    echo "   Pour installer tkinter: sudo apt-get install python3-tk"
    echo ""
    python3 "$(dirname "$0")/console_repo_explorer.py"
fi