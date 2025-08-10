# GitHub Repository Explorer - Kering

Une application pour explorer et analyser les repositories GitHub dans le répertoire défini dans votre configuration (`config.json` → `default_repository_path`).

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

## Configuration

Cette application utilise un seul fichier de configuration: `config.json`.

Clés principales:
- `default_repository_path` (Linux/WSL): chemin racine contenant vos repositories à scanner
- `max_scan_depth`, `fetch_timeout_seconds`, `gui_window_size`, `show_empty_folders`, `theme`
- `windows.distro`: nom de la distribution WSL (ex: `Ubuntu`)
- `windows.linux_project_path`: chemin Linux du projet (emplacement de ce repo) utilisé par le lanceur Windows

Exemple minimal:
```json
{
  "default_repository_path": "/home/USER/www/kering",
  "windows": {
    "distro": "Ubuntu",
    "linux_project_path": "/home/USER/www/pytool"
  }
}
```

## Utilisation

### Lancement automatique
```bash
./launch_explorer.sh
```

Le script détecte automatiquement si tkinter est disponible :
- ✅ Si tkinter est installé → Interface graphique
- ⚠️ Si tkinter n'est pas disponible → Interface console

### Lancement manuel

#### Interface graphique (nécessite tkinter)
```bash
python3 github_repo_explorer.py
```

#### Interface console
```bash
python3 console_repo_explorer.py
```

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

## Exigences

- Python 3.6+
- Git installé
- tkinter (optionnel, pour l'interface graphique)
- Accès au répertoire défini dans `config.json` (`default_repository_path`)

## Dépannage

### "ModuleNotFoundError: No module named 'tkinter'"
Installez tkinter avec votre gestionnaire de paquets système (voir ci-dessus).

### "Permission denied"
Assurez-vous que le script de lancement est exécutable :
```bash
chmod +x launch_explorer.sh
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
- Le chemin est converti dynamiquement selon la distribution WSL (définie dans `config.json` → `windows.distro`), par exemple : `\\wsl.localhost\Ubuntu\...`

## Développement

L'application est composée de deux fichiers principaux :
- `github_repo_explorer.py` : Interface graphique (tkinter)
- `console_repo_explorer.py` : Interface console
- `launch_explorer.sh` : Script de lancement automatique