# RepoScan

Une application pour explorer et analyser les repositories GitHub dans le répertoire défini dans votre configuration.

## 🚀 Comment utiliser l'application

> **⚠️ Configuration personnalisée** : Par défaut, l'application utilise `config/config.example.json` pour créer automatiquement la configuration. Si vous voulez personnaliser les chemins ou autres paramètres, copiez d'abord `config/config.example.json` vers `config/config.json` et modifiez les valeurs avant l'installation. [Voir section Configuration](#configuration) ⬇️

Vous avez **2 options** pour utiliser l'application :

### Option 1 : Raccourci Windows (recommandé)

**Idéal pour un usage quotidien** - Créez un raccourci bureau pour lancer l'app d'un double-clic :

1. **Depuis WSL/Ubuntu**, naviguez vers le projet :
   ```bash
   cd /chemin/vers/repo-scan
   ```

2. **Lancez le script d'installation** :
   ```bash
   # Via WSL (recommandé)
   ./scripts/windows/setup_desktop_shortcut.bat
   
   # Ou depuis Windows (pour éviter l'erreur UNC)
    # 1. Ouvrez l'explorateur Windows : \\wsl.localhost\Ubuntu\home\USER\www\repo-scan
   # 2. Naviguez vers scripts\windows
   # 3. Double-cliquez sur setup_desktop_shortcut.bat
   
   # Ou via PowerShell depuis Windows
   powershell -ExecutionPolicy Bypass ./scripts/windows/create_desktop_shortcut.ps1
   ```

3. **Double-cliquez sur le raccourci** créé sur votre bureau

### Option 2 : Lancement direct en ligne de commande

**Idéal pour développement/test** - Lancez directement depuis le terminal :

```bash
# Lancement automatique (détecte GUI/console)
./scripts/linux/launch_explorer.sh

# Interface graphique directe
python3 src/github_repo_explorer.py

# Interface console directe  
python3 src/console_repo_explorer.py

# Avec un chemin spécifique
python3 src/console_repo_explorer.py /chemin/vers/repositories

# Afficher la configuration actuelle
python3 src/console_repo_explorer.py --config
```

> **💡 Les deux options sont indépendantes** - vous pouvez utiliser l'une, l'autre, ou les deux selon vos besoins !


## Configuration

### Configuration automatique

Au premier lancement, l'application crée automatiquement `config/config.json` depuis `config/config.example.json`.

### Personnalisation

Éditez `config/config.json` pour personnaliser :

```json
{
  "app_name": "Mon Explorer Git",
  "shortcut_name": "Git Explorer",
  "default_repository_path": "/home/USER/www",
  "max_scan_depth": 3,
  "fetch_timeout_seconds": 30,
  "gui_window_size": "1400x1000",
  "show_empty_folders": true,
  "theme": {
    "clean_repository_color": "#d5f4e6",
    "modified_repository_color": "#ffeaa7",
    "title_background": "#2c3e50",
    "search_background": "#ecf0f1",
    "status_background": "#34495e"
  },
  "windows": {
    "distro": "Ubuntu",
    "linux_project_path": "/home/USER/www/repo-scan"
  }
}
```

**Clés principales :**
- `app_name` : Nom affiché dans le titre de l'application
- `shortcut_name` : Nom du raccourci bureau (si différent de app_name)
- `default_repository_path` : Chemin racine contenant vos repositories à scanner
- `windows.distro` : Nom de la distribution WSL (ex: `Ubuntu`)
- `windows.linux_project_path` : Chemin Linux du projet utilisé par le lanceur Windows

## Utilisation détaillée

### Lancement automatique
```bash
./scripts/linux/launch_explorer.sh
```

Le script détecte automatiquement si tkinter est disponible :
- ✅ Si tkinter est installé → Interface graphique
- ⚠️ Si tkinter n'est pas disponible → Interface console

### Ouverture de dossiers

#### Interface graphique
- **Double-cliquez** sur n'importe quelle ligne du tableau pour ouvrir le dossier correspondant

#### Interface console
Après l'affichage du tableau, tapez :
- **Nom du repository** : `sales-maki` ou `warehouse-toolkit`
- **Nom complet** : `sales-maki/sales-maki-kafka_ftp_facade`
- **q** : Pour quitter

Exemples :
```
> sales-maki
📂 Ouverture de sales-maki dans l'explorateur Windows...

> kafka
📍 Plusieurs correspondances trouvées:
   1. 📂 sales-maki/sales-maki-kafka_ftp_facade
   💡 Soyez plus précis dans votre recherche

> q
👋 Au revoir !
```

## Installation de tkinter (pour l'interface graphique)

```bash
# Ubuntu/Debian
sudo apt-get install python3-tk

# CentOS/RHEL/Fedora
sudo yum install tkinter
# ou
sudo dnf install python3-tkinter
```

## Fonctionnalités

- 📁 **Scan récursif** des dossiers jusqu'à 3 niveaux de profondeur
- 📂 **Détecte automatiquement tous les repositories Git** (même imbriqués)
- 🌿 **Affiche la branche actuelle** de chaque repository
- 💬 **Montre le dernier commit** avec son message
- 📊 **Indique le statut** (modifications, fichiers ajoutés, non trackés)
- ↕️ **Affiche la synchronisation** avec l'origin (commits en avance/retard)
- 🌐 **Montre le nom du repository remote**
- 🔍 **Fonction de recherche** (interface graphique uniquement)
- 🏗️ **Affichage hiérarchique** avec indentation pour les repositories imbriqués
- ✨ **Nom d'application configurable** (changez le titre et nom du raccourci)

## Interface graphique

- **Barre de recherche** : Filtrer par nom de repository, branche ou commit
- **Double-clic** : Ouvrir le dossier dans l'explorateur de fichiers (compatible WSL)
- **Bouton Actualiser** : Recharger les informations
- **Bouton Aide** : Affiche une fenêtre d'aide complète avec légende détaillée
- **Barre de statut intelligente** : Statistiques en temps réel (repos propres/modifiés)
- **Codes couleur** :
  - 🟢 Vert : Repository propre (pas de modifications)
  - 🟡 Jaune : Modifications non commitées

## Interface console

- **Tableau formaté** avec toutes les informations
- **Légende détaillée** : Explication complète de toutes les colonnes et symboles
- **Tri hiérarchique** : Affichage par profondeur, puis alphabétique
- **Indentation visuelle** : Les repositories imbriqués sont indentés selon leur profondeur
- **Scan récursif** : Trouve automatiquement tous les repositories jusqu'à 3 niveaux
- **Ouverture interactive** : Tapez le nom d'un repository pour l'ouvrir dans l'explorateur
- **Compatible WSL** : Utilise automatiquement `explorer.exe` dans WSL
- **Exemples concrets** : La légende montre des exemples réels d'utilisation
- **Symboles** :
  - 📂 Repository Git
  - 📁 Dossier parent
  - 🟢 Repository propre
  - 🟡 Modifications non commitées
  - ↑N : N commits en avance sur origin
  - ↓N : N commits en retard sur origin
  - `  ` : Indentation pour la hiérarchie (2 espaces par niveau)

## Informations affichées

| Colonne | Description |
|---------|-------------|
| Repository | Nom du dossier/repository |
| Branche | Branche Git actuelle |
| Statut | État du working directory (M:modifié, A:ajouté, U:non tracké) |
| Last Commit | Hash et message du dernier commit |
| Date | Date du dernier commit |
| Sync | Synchronisation avec origin (↑ en avance, ↓ en retard) |
| Remote | Nom du repository distant |

## Architecture du projet

```
repo-scan/
├── config/
│   ├── config.json          # Configuration principale (auto-créée)
│   └── config.example.json  # Template de configuration
├── docs/
│   ├── CONFIG.md            # Documentation de configuration
│   └── INSTRUCTIONS_RACCOURCI.md
├── scripts/
│   ├── linux/
│   │   └── launch_explorer.sh      # Lanceur Linux/WSL
│   └── windows/
│       ├── create_desktop_shortcut.ps1
│       ├── launch_kering_explorer.bat
│       └── setup_desktop_shortcut.bat
├── src/
│   ├── github_repo_explorer.py     # Interface graphique
│   └── console_repo_explorer.py    # Interface console
└── README.md
```

## Exigences

- Python 3.6+
- Git installé
- tkinter (optionnel, pour l'interface graphique)
- WSL avec Ubuntu (pour utilisation Windows)

## Dépannage

### "ModuleNotFoundError: No module named 'tkinter'"
Installez tkinter avec votre gestionnaire de paquets système ([voir les commandes d'installation](#installation-de-tkinter-pour-linterface-graphique)).

### "Permission denied"
Assurez-vous que le script de lancement est exécutable :
```bash
chmod +x scripts/linux/launch_explorer.sh
```

### Repositories non détectés
Vérifiez que :
- Le dossier contient un répertoire `.git`
- Vous avez les permissions de lecture
- Git est installé et accessible

### Double-clic n'ouvre pas le bon dossier (WSL)
L'application détecte automatiquement WSL et utilise `wslpath` pour convertir les chemins Linux vers Windows.
Si vous rencontrez des problèmes :
- Vérifiez que `wslpath` est disponible : `which wslpath`
- Le chemin est converti dynamiquement selon la distribution WSL (définie dans `config/config.json` → `windows.distro`), par exemple : `\\wsl.localhost\Ubuntu\...`

### Configuration manquante
Si `config/config.json` n'existe pas, il sera automatiquement créé depuis `config/config.example.json` au premier lancement.

## Développement

L'application est composée de deux fichiers principaux :
- `src/github_repo_explorer.py` : Interface graphique (tkinter)
- `src/console_repo_explorer.py` : Interface console
- `scripts/linux/launch_explorer.sh` : Script de lancement automatique