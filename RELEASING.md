# Releasing RepoScan

Ce document décrit comment publier une version de RepoScan avec auto-update.

## Architecture de release

- **Plateformes** : Linux (`.deb`, `.rpm`, `.AppImage`), Windows (`.exe` NSIS, `.msi`).
  macOS n'est pas construit pour l'instant (pas de compte Apple Developer).
- **Canaux** :
  - `stable` → tags SemVer stricts, ex. `v1.2.3`. Endpoint updater : `/releases/latest/download/latest.json`.
  - `beta` → tags pre-release, ex. `v1.2.3-beta.1`. Endpoint updater : `/releases/download/beta-channel/beta.json`.
- Le canal `beta` reçoit **aussi les stables** : la CI mirror systématiquement `latest.json` → `beta.json`, donc un beta-testeur passe automatiquement sur la stable quand elle sort (SemVer garantit `1.2.3-beta.1 < 1.2.3`).
- Signature : signature Tauri updater (clé `minisign`-style). **Pas de code-signing OS** → sur Windows, les utilisateurs verront SmartScreen "Unknown publisher" les premières semaines.

## Setup initial (une seule fois)

### 1. Générer la clé de signature updater

```bash
pnpm tauri signer generate -w ~/.tauri/reposcan.key
```

Choisir un mot de passe et le noter. Deux fichiers sont produits :
- `~/.tauri/reposcan.key` — **clé privée**, à garder secrète.
- `~/.tauri/reposcan.key.pub` — **pubkey**, à committer dans la config.

### 2. Injecter la pubkey dans `tauri.conf.json`

Remplacer la valeur `REPLACE_WITH_TAURI_UPDATER_PUBKEY` dans `src-tauri/tauri.conf.json` par le contenu de `~/.tauri/reposcan.key.pub` (une ligne base64).

Committer ce changement.

### 3. Configurer les GitHub Secrets

Sur https://github.com/Nolyo/RepoScan/settings/secrets/actions, ajouter :

- `TAURI_SIGNING_PRIVATE_KEY` : contenu complet de `~/.tauri/reposcan.key`.
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` : le mot de passe choisi à l'étape 1.

## Publier une release

### 1. Bump de version

Mettre à jour la version dans **les trois fichiers** (doivent rester synchronisés) :

- `package.json` → champ `version`
- `src-tauri/Cargo.toml` → `[package] version = "..."`
- `src-tauri/tauri.conf.json` → `version`

Format :
- Stable : `1.2.3`
- Bêta : `1.2.3-beta.1`, `1.2.3-beta.2`, etc.

### 2. Commit + tag + push

```bash
git add -A
git commit -m "chore: release v1.2.3"
git tag v1.2.3
git push origin main --tags
```

Le workflow `.github/workflows/release.yml` s'exécute automatiquement sur le push de tag :
1. Build Linux + Windows en parallèle.
2. Création de la release GitHub (pre-release si le tag contient `-beta`, `-rc` ou `-alpha`).
3. Upload des installeurs et du `latest.json` signé.
4. Mirror de `latest.json` vers `beta.json` sur la release rolling `beta-channel`.

Suivre la progression sur https://github.com/Nolyo/RepoScan/actions.

### 3. Vérification post-release

- Télécharger un installeur depuis la release et l'installer sur une machine vierge.
- Relancer la version **précédente** (ex. `1.2.2`) déjà installée → au démarrage, un toast doit proposer la mise à jour vers `1.2.3`.
- Vérifier que "Installer et redémarrer" télécharge, installe et relance l'app sur la nouvelle version.
- Tester les deux canaux en changeant le réglage **Paramètres → Canal de mise à jour**.

## Dépannage

- **"signature verification failed"** au check update : la pubkey dans `tauri.conf.json` ne correspond pas à la clé privée utilisée par la CI. Régénérer en cohérence.
- **SmartScreen bloque l'installation Windows** : cliquer sur "Informations complémentaires" → "Exécuter quand même". Attendu tant qu'on n'a pas de cert code-signing EV.
- **Pas de `latest.json` produit par `tauri-action`** : vérifier que `bundle.createUpdaterArtifacts` est `true` dans `tauri.conf.json` et que les secrets CI sont bien configurés.
