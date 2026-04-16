#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT" || exit 1

# ─── 1. Python3 ──────────────────────────────────────────────────────────────
if ! command -v python3 &>/dev/null; then
    echo "Installation de Python3..."
    sudo apt-get install -y python3
fi

# ─── 2. python3-tk ───────────────────────────────────────────────────────────
if ! python3 -c "import tkinter" &>/dev/null 2>&1; then
    echo ""
    echo "Installation de python3-tk (interface graphique)..."
    sudo apt-get install -y python3-tk
    echo ""
fi

# ─── 3. Display WSLg ─────────────────────────────────────────────────────────
# Sur certaines configs, DISPLAY n'est pas hérité par bash -lc
if [ -z "$DISPLAY" ] && [ -z "$WAYLAND_DISPLAY" ]; then
    [ -e /tmp/.X11-unix/X0 ] && export DISPLAY=:0
    RUN_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}"
    [ -e "$RUN_DIR/wayland-0" ] && export WAYLAND_DISPLAY=wayland-0
fi

# ─── 4. Configuration (premier lancement) ────────────────────────────────────
if [ ! -f "config/config.json" ]; then
    python3 src/setup_wizard.py
    [ $? -ne 0 ] && { echo "Configuration annulée."; exit 1; }
fi

# ─── 5. Lancement ────────────────────────────────────────────────────────────
GUI_OK=false
if python3 -c "import tkinter" &>/dev/null 2>&1; then
    if [ -n "$DISPLAY" ] || [ -n "$WAYLAND_DISPLAY" ]; then
        GUI_OK=true
    fi
fi

if $GUI_OK; then
    # Marquer le setup comme terminé pour les prochains lancements (mode silencieux)
    touch config/.setup_done 2>/dev/null
    echo "Lancement de RepoScan..."
    # Détacher le GUI du terminal : la fenêtre de setup peut se fermer
    nohup python3 src/github_repo_explorer.py >/dev/null 2>&1 &
    # Attendre un instant que la fenêtre s'ouvre avant de fermer le terminal
    sleep 2
else
    echo ""
    echo "Interface graphique indisponible."
    if ! python3 -c "import tkinter" &>/dev/null 2>&1; then
        echo "  → Installez tkinter : sudo apt-get install python3-tk"
    else
        echo "  → Aucun serveur d'affichage détecté (DISPLAY/WAYLAND_DISPLAY non défini)."
    fi
    echo ""
    echo "Lancement en mode console..."
    python3 src/console_repo_explorer.py
fi
