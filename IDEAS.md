# RepoScan — Idées d'amélioration

Brainstorming libre. Tri à faire côté produit. Chaque idée est notée sur trois axes indicatifs :
- **Effort** : S (≤1j), M (2-5j), L (>1 sem.)
- **Valeur** : ⭐ à ⭐⭐⭐
- **Risque** : faible / moyen / élevé

---

## 1. Vue & navigation

### 1.1 Dashboard d'accueil avant la table
Un écran d'entrée avec des KPI visuels : nombre de repos dirty, ahead/behind totaux, repos "stale" (inactifs > 3 mois), top 5 des repos les plus commités cette semaine. Un coup d'œil et on sait où aller.
Effort M · Valeur ⭐⭐⭐ · Risque faible

### 1.2 Groupements dynamiques
Au lieu de l'arbre fichier uniquement, permettre de grouper par :
- **Remote owner** (`kering-technologies/*`, `perso/*`)
- **Langage principal** (détecté via extension dominante)
- **État** (dirty / clean / ahead / behind)
- **Dernier commit** (aujourd'hui, cette semaine, ce mois, plus vieux)
Effort M · Valeur ⭐⭐ · Risque faible

### 1.3 Favoris & tags perso
Chaque repo peut recevoir des tags libres (`wip`, `archive`, `client-X`, `à-reviewer`). Filtre combinable avec la recherche actuelle. Les tags sont stockés dans la config (pas dans les repos).
Effort S · Valeur ⭐⭐ · Risque faible

### 1.4 Mode "focus"
Mode plein écran avec juste la liste filtrée et les actions clavier — pour quand on fait une revue hebdo de ses repos. Un `Zen mode` façon éditeur.
Effort S · Valeur ⭐ · Risque faible

### 1.5 Multi-root
Aujourd'hui un seul `rootPath`. Permettre plusieurs racines (`~/www`, `~/perso`, `/mnt/d/code`) avec sections collapsibles.
Effort M · Valeur ⭐⭐ · Risque faible

### 1.6 Profils (work / perso)
Bascule rapide entre plusieurs configurations complètes (root, concurrence, éditeur, owner GitHub par défaut). Utile quand on jongle entre perso et pro.
Effort M · Valeur ⭐⭐ · Risque faible

---

## 2. Insights & visualisation

### 2.1 Sparklines d'activité par repo
Une mini-sparkline sur chaque ligne de la table montrant les commits des 30 derniers jours. Visuellement on repère instantanément les repos actifs.
Effort M · Valeur ⭐⭐⭐ · Risque faible

### 2.2 Heatmap type GitHub
Un panneau latéral avec une heatmap agrégée (tous repos confondus, ou par repo sélectionné) façon contribution graph.
Effort M · Valeur ⭐⭐ · Risque faible

### 2.3 Health score
Un score simple (0-100) par repo basé sur : working tree propre, pas de drift ahead/behind énorme, dernier commit récent, pas de conflit, lockfile à jour. Badge coloré dans la table.
Effort M · Valeur ⭐⭐ · Risque moyen (subjectif)

### 2.4 Détection de repos "morts"
Règle configurable : aucun commit depuis N mois → badge "stale" + filtre dédié. Propose une action "archiver" qui déplace dans un sous-dossier `_archive/`.
Effort S · Valeur ⭐⭐ · Risque faible

### 2.5 Taille disque + nettoyage
Afficher la taille de chaque repo, et surtout la taille des artefacts détectés (`node_modules`, `target`, `dist`, `.next`, `vendor`). Bouton "cleanup" par repo ou global avec preview.
Effort M · Valeur ⭐⭐⭐ · Risque moyen (destructif)

### 2.6 Mini-graph de commit
Au survol d'une ligne, une infobulle avec les 5 derniers commits (hash, sujet, auteur, âge relatif). Pas besoin d'ouvrir un terminal pour savoir ce qui s'est passé récemment.
Effort S · Valeur ⭐⭐ · Risque faible

---

## 3. Actions git enrichies

### 3.1 Bulk actions
- **Pull all** (en plus du fetch all) avec gestion des conflits/unclean
- **Prune all** (branches locales sans remote)
- **Stash all** avant un pull risqué
- **Switch default branch** (sur une sélection)
Effort M · Valeur ⭐⭐⭐ · Risque moyen

### 3.2 Branch overview par repo
Panneau latéral quand on clique sur un repo : liste des branches locales avec âge, ahead/behind vs. upstream, dernier commit. Bouton "checkout" / "delete" inline.
Effort M · Valeur ⭐⭐ · Risque moyen

### 3.3 Stash browser
Liste des stashes de chaque repo, avec aperçu et bouton apply/drop.
Effort S · Valeur ⭐ · Risque faible

### 3.4 Quick commit
Champ "message" + bouton "commit all" pour les repos avec seulement un/deux fichiers modifiés (typiquement config, README). Utile pour les mises à jour en masse.
Effort S · Valeur ⭐ · Risque élevé (commits involontaires)

### 3.5 Worktree manager
Liste et crée des worktrees pour chaque repo. Pratique pour tester une PR sans perdre le WIP courant.
Effort L · Valeur ⭐⭐ · Risque faible

### 3.6 Tag & release preview
Pour chaque repo avec des tags : afficher le dernier tag, proposer un preview "semantic version" basé sur les commits depuis ce tag (inspiré de `semantic-release`).
Effort L · Valeur ⭐ · Risque faible

---

## 4. Intégrations externes

### 4.1 Statut CI GitHub Actions
À côté de `ahead/behind`, afficher le statut du dernier workflow run de la branche courante. Icône verte/rouge/jaune. Clic → ouvre la page Actions.
Effort M · Valeur ⭐⭐⭐ · Risque faible

### 4.2 PRs ouvertes par repo
Via `gh pr list`, badge avec le nombre de PR ouvertes. Clic → liste avec titres et auteurs.
Effort S · Valeur ⭐⭐ · Risque faible

### 4.3 Issue tracker liée à la branche
Si la branche courante matche un pattern (`feat/ABC-123-foo`), extraction auto et lien vers Jira / Linear / GitHub Issues. Configurable.
Effort M · Valeur ⭐⭐ · Risque faible

### 4.4 Intégration `gitleaks` / détection de secrets
Scan rapide du working tree pour détecter des patterns de secrets (clés AWS, tokens). Alerte visible dans la table si détecté.
Effort M · Valeur ⭐⭐ · Risque faible

### 4.5 Dépendances obsolètes
Pour chaque `package.json` / `Cargo.toml` / `go.mod`, indiquer le nombre de dépendances outdated (via `npm outdated` / `cargo outdated`). Badge "N dépendances à jour". Cache 24h.
Effort M · Valeur ⭐⭐ · Risque faible

### 4.6 Script runner intégré
Clic droit → "Run script" → liste les scripts du `package.json` / `Makefile` / `justfile` / `Cargo.toml` (cargo run examples). Lance dans un terminal embarqué ou délègue au terminal système.
Effort L · Valeur ⭐⭐ · Risque moyen

---

## 5. Productivité & UX

### 5.1 Command palette étendue
Aujourd'hui `Ctrl+K` ouvre le clone palette. En étendre le scope : `Ctrl+K` → palette universelle (repos, actions, settings, récents). Type "fetch " → filtre actions, type "rep:" → filtre repos.
Effort M · Valeur ⭐⭐⭐ · Risque faible

### 5.2 Navigation vim-like
`j`/`k` pour naviguer la table, `o` pour ouvrir dans l'éditeur, `O` dans l'explorer, `g` pour aller en haut, `G` en bas, `/` pour la recherche. Opt-in via réglage.
Effort S · Valeur ⭐⭐ · Risque faible

### 5.3 Raccourcis contextuels
Shortcut overlay (`?`) qui affiche tous les raccourcis disponibles. Classique mais apprécié.
Effort S · Valeur ⭐ · Risque faible

### 5.4 Historique & undo
Historique des opérations (fetch, clone, open) avec un log accessible depuis le menu. "Replay last fetch all". Utile pour débug.
Effort S · Valeur ⭐ · Risque faible

### 5.5 Tray icon / mode background
Icône dans la barre système. L'app peut tourner en arrière-plan et faire un fetch auto périodique, notification desktop si un repo a du nouveau upstream.
Effort L · Valeur ⭐⭐ · Risque moyen

### 5.6 Notifications desktop
Fin de `fetch all`, conflits détectés, nouveau commit upstream sur un repo favori. Via `tauri-plugin-notification`.
Effort S · Valeur ⭐ · Risque faible

### 5.7 Mode TV / dashboard
Layout grand écran pour afficher sur un 2e moniteur : cartes avec état + sparklines. Refresh auto.
Effort M · Valeur ⭐ · Risque faible

---

## 6. Recherche puissante

### 6.1 Recherche cross-repo full-text
Intégrer `ripgrep` (bundled). `Ctrl+Shift+F` ouvre un panneau qui cherche dans tous les repos du root. Clic sur résultat → ouvre dans l'éditeur préféré à la bonne ligne.
Effort L · Valeur ⭐⭐⭐ · Risque faible

### 6.2 Recherche de commits
Chercher un message de commit ou un hash à travers tous les repos. "Où ai-je implémenté X il y a 3 mois ?"
Effort M · Valeur ⭐⭐ · Risque faible

### 6.3 Recherche d'auteurs
"Tous les repos où j'ai commité", "tous les repos où X a commité récemment". Utile pour les revues.
Effort S · Valeur ⭐ · Risque faible

---

## 7. Intelligence & automatisation

### 7.1 Résumé IA des changements
Pour un repo donné, bouton "What's new?" qui envoie les N derniers commits (ou le diff ahead/behind) à un LLM local ou Anthropic API avec un prompt type "résume ce qui a changé, en français, pour un dev qui revient de vacances". Optionnel + clé utilisateur.
Effort M · Valeur ⭐⭐ · Risque moyen (privacy)

### 7.2 Détection d'anomalies
Heuristique : repo qui a un grand nombre de fichiers untracked inhabituels, build output commité par erreur, tailles qui explosent. Alerte discrète.
Effort M · Valeur ⭐ · Risque faible

### 7.3 Auto-fetch intelligent
Fetch de fond toutes les N minutes, mais seulement sur les repos "actifs" (commit récent, favoris). Évite de flooder les serveurs git.
Effort S · Valeur ⭐⭐ · Risque faible

### 7.4 Suggestion "branche à nettoyer"
Détecte les branches locales mergées sur la default branch → propose une liste "safe to delete" avec un bouton global.
Effort S · Valeur ⭐⭐ · Risque moyen (destructif)

---

## 8. Fondations techniques

### 8.1 Tests end-to-end
Playwright ou équivalent pour piloter l'UI Tauri. Un repo de test factice avec états variés commité en fixture. Sécurise les régressions.
Effort M · Valeur ⭐⭐⭐ · Risque faible

### 8.2 Mode "CLI"
`reposcan --json` pour dumper l'état de tous les repos en JSON depuis un terminal. Permet de scripter (hook pre-commit global, dashboards externes, scripts de nettoyage).
Effort M · Valeur ⭐⭐ · Risque faible

### 8.3 Export / partage de config
Export/import JSON de la config (sans chemins perso auto-censurés). Permet de partager ses réglages entre machines.
Effort S · Valeur ⭐ · Risque faible

### 8.4 Plugins / commandes utilisateur
Permettre à l'utilisateur d'ajouter des commandes custom au menu contextuel (shell command + placeholder `{path}`). Exemples : `lazygit {path}`, `tig -C {path}`, `open iTerm here`.
Effort M · Valeur ⭐⭐⭐ · Risque moyen (sécurité)

### 8.5 i18n
Les chaînes UI sont en français/anglais mélangés. Structurer les strings dans un fichier de traduction, exposer `en` + `fr` minimum. Ouvre la porte à d'autres langues.
Effort M · Valeur ⭐ · Risque faible

### 8.6 Télémétrie opt-in (privacy-first)
Métrique agrégée et anonyme sur les fonctionnalités réellement utilisées. Aide à prioriser. Opt-in explicite uniquement.
Effort M · Valeur ⭐ · Risque élevé (perception)

---

## 9. Identité & polish

### 9.1 Icône & branding
Logo custom, screenshots marketing, page GitHub Pages. L'app est prête à être partagée — il manque la vitrine.
Effort S · Valeur ⭐⭐ · Risque faible

### 9.2 Onboarding amélioré
Tour guidé (3-4 étapes) à la première installation : "voici la liste, voici le fetch all, voici le Ctrl+K". Skippable.
Effort S · Valeur ⭐ · Risque faible

### 9.3 Thèmes custom
Au-delà de light/dark/system, permettre des palettes (Solarized, Gruvbox, Catppuccin). Pour se sentir chez soi.
Effort S · Valeur ⭐ · Risque faible

### 9.4 Signature de code Windows
L'avertissement SmartScreen mentionné dans le README dégrade la première impression. Certificat OV (~200€/an) ou Azure Trusted Signing. Ça vaut le coup dès que l'app passe le cap des premiers utilisateurs externes.
Effort M · Valeur ⭐⭐ · Risque faible

---

## Top 5 suggérés pour commencer

Si je devais prioriser pour le prochain cycle, je miserais sur :

1. **Sparklines d'activité (2.1)** — visuellement fort, implémentation contenue
2. **Statut CI GitHub Actions (4.1)** — valeur immédiate pour les devs qui bossent avec des workflows
3. **Command palette étendue (5.1)** — démultiplie l'usage clavier, effet "pro"
4. **Cleanup disk (2.5)** — résout un vrai problème concret (`node_modules` qui s'accumulent)
5. **Plugins / commandes custom (8.4)** — l'app devient extensible sans que tu doives coder chaque idée

Le reste est à piocher selon envie.
