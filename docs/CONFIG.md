# 🔧 Configuration - RepoScan

## 📁 Fichier de configuration

L'application utilise un fichier `config.json` pour stocker ses paramètres. Ce fichier est créé automatiquement au premier lancement avec les valeurs par défaut.

### 📍 Localisation
Le fichier `config.json` se trouve dans le dossier `config/config.json` à la racine du projet.

## ⚙️ Structure de la configuration

```json
{
    "app_name": "RepoScan",
    "shortcut_name": "RepoScan",
    "default_repository_path": "/home/yjaffres/www/kering",
    "max_scan_depth": 3,
    "fetch_timeout_seconds": 30,
    "gui_window_size": "1400x800",
    "show_empty_folders": true,
    "windows": {
        "distro": "Ubuntu",
        "linux_project_path": "/home/USER/www/repo-scan"
    }
}
```

## 📝 Description des paramètres

| Paramètre | Description | Valeur par défaut |
|-----------|-------------|-------------------|
| `app_name` | Nom public de l'application (GUI: titre, Console: bannière) | `"RepoScan"` |
| `shortcut_name` | Nom du raccourci Windows généré | `"RepoScan"` |
| `default_repository_path` | Chemin du dossier racine contenant vos repositories Git | `/home/yjaffres/www/kering` |
| `max_scan_depth` | Profondeur maximale de scan récursif | `3` |
| `fetch_timeout_seconds` | Timeout en secondes pour les opérations `git fetch` | `30` |
| `gui_window_size` | Taille de la fenêtre GUI (largeurxhauteur) | `"1400x800"` |
| `show_empty_folders` | Afficher les dossiers sans repositories Git | `true` |

### 🎨 Thème (couleurs de l'interface)

| Paramètre | Description | Couleur par défaut |
|-----------|-------------|--------------------|
| `clean_repository_color` | Couleur de fond pour repos propres | `#d5f4e6` (vert clair) |
| `modified_repository_color` | Couleur de fond pour repos modifiés | `#ffeaa7` (jaune clair) |
| `title_background` | Couleur de fond du titre | `#2c3e50` (bleu foncé) |
| `search_background` | Couleur de fond barre de recherche | `#ecf0f1` (gris clair) |
| `status_background` | Couleur de fond barre de statut | `#34495e` (gris foncé) |

## 🚀 Méthodes de configuration

### 🪟 Paramètres Windows

| Paramètre | Description | Exemple |
|-----------|-------------|---------|
| `windows.distro` | Nom de la distribution WSL utilisée par le lanceur Windows | `"Ubuntu"` |
| `windows.linux_project_path` | Chemin Linux du projet (emplacement de ce repo) utilisé par le lanceur Windows | `"/home/USER/www/repo-scan"` |

### 1. **Interface graphique** (Recommandée)
- Lancez l'application GUI
- Cliquez sur le bouton **">>> Changer Dossier"**
- Sélectionnez votre dossier dans la boîte de dialogue
- La configuration est automatiquement sauvegardée

### 2. **Ligne de commande**
```bash
# Utiliser un chemin spécifique (temporaire)
python3 github_repo_explorer.py /path/to/your/repos

# Afficher la configuration actuelle
python3 github_repo_explorer.py --config
```

### 3. **Édition manuelle**
```bash
# Ouvrir le fichier de configuration
nano config.json

# Ou avec VS Code
code config.json
```

## 🔄 Exemples d'utilisation pour vos collègues

### Configuration pour un collègue avec des repos dans `/home/username/projects`

1. **Méthode simple** : Copier le dossier et modifier `config.json`
```json
{
    "default_repository_path": "/home/username/projects"
}
```

2. **Méthode ligne de commande** :
```bash
python3 github_repo_explorer.py /home/username/projects
```

3. **Méthode GUI** : Lancer l'app et cliquer "Changer Dossier"

### Configuration pour Windows
```json
{
    "default_repository_path": "C:\\Users\\username\\Documents\\repositories"
}
```

### Configuration pour macOS
```json
{
    "default_repository_path": "/Users/username/Developer/repos"
}
```

## 🛠️ Variables d'environnement (optionnel)

Vous pouvez aussi utiliser une variable d'environnement :

```bash
# Linux/macOS
export REPO_PATH="/path/to/repos"
python3 github_repo_explorer.py

# Windows
set REPO_PATH=C:\path\to\repos
python github_repo_explorer.py
```

## 📋 Configuration recommandée pour équipe

Pour partager l'outil avec votre équipe :

1. **Créer un `config.json` générique** :
```json
{
    "default_repository_path": "./",
    "max_scan_depth": 3,
    "fetch_timeout_seconds": 30
}
```

2. **Documenter dans le README** les chemins spécifiques à chaque environnement

3. **Utiliser des arguments de ligne de commande** pour flexibilité :
```bash
python3 github_repo_explorer.py ~/work/repositories
```

## 🔍 Dépannage

### ❌ "Le chemin n'existe pas"
**Solutions :**
- Vérifiez le chemin dans `config.json`
- Utilisez un chemin absolu
- Testez avec : `python3 github_repo_explorer.py --config`

### ❌ "Erreur de chargement de la config"
**Solutions :**
- Supprimez `config.json` (sera recréé automatiquement)
- Vérifiez la syntaxe JSON avec un validateur
- Restaurez les valeurs par défaut

### ❌ Permissions
**Solutions :**
- Vérifiez les droits de lecture/écriture sur le dossier
- Lancez avec `sudo` si nécessaire (non recommandé)

---

💡 **Astuce** : La configuration est automatiquement synchronisée entre la version GUI et console !