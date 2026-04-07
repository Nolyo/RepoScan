# RepoScan

Dashboard local pour visualiser l'état de tous vos dépôts Git dans un répertoire.

Affiche pour chaque repo : branche courante, dernier commit, modifications en cours, synchronisation avec l'origin.

## Démarrage rapide

### Depuis Windows (double-clic)

1. Ouvrez le dossier du projet dans l'Explorateur Windows :
   ```
   \\wsl.localhost\<Distro>\home\<user>\www\RepoScan
   ```
2. Double-cliquez sur **`RepoScan.bat`**

**Premier lancement** : une fenêtre de terminal s'ouvre, installe automatiquement les dépendances (`python3-tk`), vous guide dans la configuration, puis l'application démarre. La fenêtre se ferme toute seule.

**Lancements suivants** : l'application démarre directement, sans aucune console visible.

### Depuis WSL / Linux

```bash
git clone <url> ~/www/RepoScan
cd ~/www/RepoScan
./run.sh
```

## Raccourci bureau (optionnel)

Pour créer un raccourci sur le bureau Windows, ouvrez le dossier `scripts\windows` dans l'Explorateur et double-cliquez sur `setup_desktop_shortcut.bat`.

Voir les détails dans [docs/INSTRUCTIONS_RACCOURCI.md](docs/INSTRUCTIONS_RACCOURCI.md).

## Configuration

La configuration est stockée dans `config/config.json` (créé automatiquement par l'assistant).

Pour modifier les paramètres directement :

```json
{
  "default_repository_path": "/home/user/www",
  "max_scan_depth": 3,
  "fetch_timeout_seconds": 30,
  "gui_window_size": "1400x1000",
  "show_empty_folders": true,
  "windows": {
    "distro": "Ubuntu-22.04",
    "linux_project_path": "/home/user/www/RepoScan"
  }
}
```

Voir la référence complète dans [docs/CONFIG.md](docs/CONFIG.md).

## Fonctionnalités

- Scan récursif jusqu'à 3 niveaux de profondeur (configurable)
- Détection automatique de tous les dépôts Git
- Affichage de la branche, du dernier commit, du statut et de la synchro avec l'origin
- Interface graphique (tkinter) avec recherche, filtres et codes couleur
- Interface console en fallback si tkinter n'est pas disponible
- Ouverture d'un repo dans l'Explorateur, VS Code ou Cursor depuis le menu contextuel
- Ouverture du repo sur GitHub depuis le menu contextuel
- Raccourcis clavier : `Ctrl+Entrée` (VS Code), `Ctrl+C` (copier le chemin)
- "Fetch All" : synchronisation de tous les repos en arrière-plan
- Compatible WSL : conversion automatique des chemins Linux ↔ Windows

## Prérequis

- Python 3.10+
- Git
- WSL2 (pour l'utilisation sous Windows)
- `python3-tk` (optionnel, pour l'interface graphique)

Installation de tkinter sous Ubuntu/Debian :
```bash
sudo apt-get install python3-tk
```

## Architecture

```
RepoScan/
├── RepoScan.bat                     # Point d'entrée Windows (double-clic)
├── run.sh                           # Point d'entrée WSL/Linux
├── config/
│   ├── config.example.json          # Template de configuration
│   └── config.json                  # Configuration utilisateur (gitignored)
├── docs/
│   ├── CONFIG.md                    # Référence configuration
│   └── INSTRUCTIONS_RACCOURCI.md   # Guide raccourci Windows
├── scripts/
│   ├── linux/
│   │   └── launch_explorer.sh       # Lanceur Linux/WSL
│   └── windows/
│       ├── launch.bat               # Lanceur Windows → WSL
│       ├── launch_silent.ps1        # Lanceur silencieux
│       ├── setup_desktop_shortcut.bat
│       └── create_desktop_shortcut.ps1
└── src/
    ├── config_manager.py            # Gestion de la configuration
    ├── setup_wizard.py              # Assistant de configuration (1er lancement)
    ├── github_repo_explorer.py      # Interface graphique
    └── console_repo_explorer.py     # Interface console
```

## Dépannage

### "ModuleNotFoundError: No module named 'tkinter'"
```bash
sudo apt-get install python3-tk
```

### "Permission denied" sur le script
```bash
chmod +x run.sh scripts/linux/launch_explorer.sh
```

### Les dépôts ne sont pas détectés
Vérifiez que `default_repository_path` dans `config/config.json` pointe vers le bon dossier et que vos répertoires contiennent bien un sous-dossier `.git`.

### Le double-clic sur RepoScan.bat ne lance pas l'app
- Vérifiez que WSL est démarré (`wsl --status` dans PowerShell)
- Vérifiez que le chemin WSL du projet est accessible
- Consultez le log dans `scripts/windows/launch.log` si vous utilisez `launch.bat`
