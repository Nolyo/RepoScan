# Créer un raccourci bureau pour RepoScan

## Méthode automatique (recommandée)

1. Ouvrez le dossier `scripts\windows` dans l'Explorateur Windows :
   ```
   \\wsl.localhost\<Distro>\home\<user>\www\RepoScan\scripts\windows
   ```
2. Double-cliquez sur **`setup_desktop_shortcut.bat`**
3. Choisissez le mode de lancement :
   - **Standard** : une console s'affiche 3 secondes au démarrage
   - **Silencieux** : aucune console visible

Le raccourci **RepoScan** est créé sur le bureau.

---

## Méthode alternative (PowerShell)

```powershell
# Depuis le dossier scripts\windows du projet
.\create_desktop_shortcut.ps1
```

---

## Utilisation du raccourci

Double-cliquez sur le raccourci **RepoScan** sur le bureau.

- Premier lancement : l'assistant de configuration s'ouvre
- Lancements suivants : l'application démarre directement

---

## Dépannage

**"WSL non trouvé"**
```cmd
wsl --list --verbose
```
Vérifiez que votre distribution WSL est démarrée.

**"Fichier non trouvé"**
Vérifiez que le chemin vers le projet est correct dans `config/config.json` → `windows.linux_project_path`.

**Le raccourci ne fonctionne plus après avoir déplacé le projet**
Relancez `setup_desktop_shortcut.bat` depuis le nouvel emplacement, ou mettez à jour `windows.linux_project_path` dans `config/config.json`.
