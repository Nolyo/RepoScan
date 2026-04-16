#!/bin/bash
# Point d'entrée principal de RepoScan (WSL / Linux)
# Usage : ./run.sh
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR" && bash scripts/linux/launch_explorer.sh
