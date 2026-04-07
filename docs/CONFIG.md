# Configuration - RepoScan

## Fichier de configuration

L'application utilise `config/config.json`. Ce fichier est créé automatiquement au premier lancement par l'assistant de configuration.

Il est ignoré par git (`.gitignore`) — chaque utilisateur a sa propre configuration.

## Structure

```json
{
  "app_name": "RepoScan",
  "shortcut_name": "RepoScan",
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

## Paramètres

| Paramètre | Description | Défaut |
|-----------|-------------|--------|
| `app_name` | Nom affiché dans le titre de la fenêtre | `"RepoScan"` |
| `shortcut_name` | Nom du raccourci bureau Windows | `"RepoScan"` |
| `default_repository_path` | Dossier racine contenant vos dépôts Git | détecté automatiquement |
| `max_scan_depth` | Profondeur max de scan récursif | `3` |
| `fetch_timeout_seconds` | Timeout pour `git fetch` en secondes | `30` |
| `gui_window_size` | Taille de la fenêtre GUI | `"1400x1000"` |
| `show_empty_folders` | Afficher les dossiers sans dépôts Git | `true` |

### Paramètres Windows (section `windows`)

| Paramètre | Description | Exemple |
|-----------|-------------|---------|
| `windows.distro` | Nom de la distribution WSL | `"Ubuntu-22.04"` |
| `windows.linux_project_path` | Chemin Linux du projet (utilisé par `launch.bat`) | `"/home/user/www/RepoScan"` |

> **Note :** `windows.linux_project_path` n'est pas nécessaire pour `RepoScan.bat` (auto-détecté via `wslpath`). Il est utilisé par `scripts/windows/launch.bat` (raccourci bureau).

## Modifier la configuration

### Via l'interface graphique
Cliquez sur le bouton **"Changer Dossier"** pour modifier le chemin des repositories. La modification est sauvegardée automatiquement.

### Édition manuelle
```bash
nano config/config.json
# ou
code config/config.json
```

### Réinitialiser la configuration
Supprimez `config/config.json` et relancez l'application : l'assistant de configuration s'ouvrira à nouveau.
