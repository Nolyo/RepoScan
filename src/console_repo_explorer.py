#!/usr/bin/env python3

import os
import sys
import subprocess
from datetime import datetime
import json
import argparse
from pathlib import Path
import shutil

class ConfigManager:
    def __init__(self, config_file: str | None = None):
        self.config_file = self._resolve_config_path(config_file)
        self.config = self._load_config()

    @staticmethod
    def _resolve_config_path(config_file: str | None) -> str:
        """Résout de manière robuste le chemin vers config.json.
        Ordre de recherche:
        1) Paramètre explicite si fourni
        2) CWD/config/config.json (lancement depuis la racine du projet)
        3) ../config/config.json relatif au fichier source (src/..)
        4) CWD/config.json (compat)
        """
        if config_file:
            return config_file

        cwd = Path.cwd()
        candidate1 = cwd / "config" / "config.json"
        if candidate1.exists():
            return str(candidate1)

        here = Path(__file__).resolve()
        candidate2 = here.parent.parent / "config" / "config.json"
        if candidate2.exists():
            return str(candidate2)

        candidate3 = cwd / "config.json"
        return str(candidate3)
    
    @staticmethod
    def _find_config_example(config_path: str) -> str | None:
        """Trouve le fichier config.example.json correspondant au config.json"""
        config_dir = Path(config_path).parent
        example_file = config_dir / "config.example.json"
        if example_file.exists():
            return str(example_file)
        
        # Si config.json est à la racine, chercher aussi dans config/config.example.json
        if config_dir.name != "config":
            config_subdir = config_dir / "config" / "config.example.json"
            if config_subdir.exists():
                return str(config_subdir)
        
        return None
    
    def _load_config(self):
        """Charge la configuration depuis le fichier JSON"""
        try:
            if os.path.exists(self.config_file):
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            else:
                # Copier config.example.json vers config.json si disponible
                example_file = self._find_config_example(self.config_file)
                if example_file:
                    # Créer le répertoire si nécessaire
                    config_dir = Path(self.config_file).parent
                    config_dir.mkdir(parents=True, exist_ok=True)
                    
                    shutil.copy2(example_file, self.config_file)
                    print(f"Configuration créée depuis {example_file}")
                    
                    with open(self.config_file, 'r', encoding='utf-8') as f:
                        return json.load(f)
                else:
                    raise FileNotFoundError(f"Aucun fichier config.example.json trouvé près de {self.config_file}")
        except Exception as e:
            print(f"Erreur lors du chargement de la config: {e}")
            # Fallback minimal en cas d'erreur
            return {
                "app_name": "Git Repo Explorer",
                "shortcut_name": "Git Repo Explorer",
                "default_repository_path": str(Path.home()),
                "max_scan_depth": 3,
                "fetch_timeout_seconds": 30,
                "gui_window_size": "1400x800",
                "show_empty_folders": True
            }
    
    def save_config(self, config=None):
        """Sauvegarde la configuration dans le fichier JSON"""
        try:
            config_to_save = config or self.config
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(config_to_save, f, indent=4, ensure_ascii=False)
            return True
        except Exception as e:
            print(f"Erreur lors de la sauvegarde de la config: {e}")
            return False
    
    def get(self, key, default=None):
        """Récupère une valeur de configuration"""
        keys = key.split('.')
        value = self.config
        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            else:
                return default
        return value
    
    def set(self, key, value):
        """Définit une valeur de configuration"""
        keys = key.split('.')
        config = self.config
        for k in keys[:-1]:
            if k not in config:
                config[k] = {}
            config = config[k]
        config[keys[-1]] = value
        self.save_config()

class GitRepoInfo:
    def __init__(self, path, relative_path=None):
        self.path = path
        self.name = os.path.basename(path)
        self.relative_path = relative_path or self.name
        self.is_git_repo = False
        self.current_branch = "N/A"
        self.last_commit = "N/A"
        self.last_commit_date = "N/A"
        self.status = "N/A"
        self.remote_url = "N/A"
        self.ahead_behind = "N/A"
        self.depth = self.relative_path.count(os.sep)
        
        self._analyze_repo()
    
    def _run_git_command(self, command):
        try:
            result = subprocess.run(
                ["git"] + command,
                cwd=self.path,
                capture_output=True,
                text=True,
                timeout=5
            )
            return result.stdout.strip() if result.returncode == 0 else None
        except (subprocess.SubprocessError, FileNotFoundError):
            return None
    
    def fetch_from_remote(self):
        """Effectue un git fetch pour ce repository"""
        if not self.is_git_repo:
            return {"success": False, "error": "Not a git repository"}
        
        try:
            result = subprocess.run(
                ["git", "fetch", "--all"],
                cwd=self.path,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                # Re-analyser le repository après fetch
                self._analyze_repo()
                return {"success": True, "message": "Fetch successful"}
            else:
                return {"success": False, "error": result.stderr.strip() or "Fetch failed"}
                
        except subprocess.TimeoutExpired:
            return {"success": False, "error": "Fetch timeout (30s)"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _analyze_repo(self):
        if not os.path.exists(os.path.join(self.path, ".git")):
            return
            
        self.is_git_repo = True
        
        # Branche actuelle
        branch = self._run_git_command(["branch", "--show-current"])
        if branch:
            self.current_branch = branch
        
        # Dernier commit
        commit = self._run_git_command(["log", "-1", "--format=%h - %s"])
        if commit:
            self.last_commit = commit[:60] + "..." if len(commit) > 60 else commit
        
        # Date du dernier commit
        commit_date = self._run_git_command(["log", "-1", "--format=%cd", "--date=short"])
        if commit_date:
            self.last_commit_date = commit_date
        
        # Statut
        status = self._run_git_command(["status", "--porcelain"])
        if status is not None:
            if status:
                lines = status.split('\n')
                modified = len([l for l in lines if l.startswith(' M')])
                added = len([l for l in lines if l.startswith('A')])
                untracked = len([l for l in lines if l.startswith('??')])
                self.status = f"M:{modified} A:{added} U:{untracked}"
            else:
                self.status = "Clean"
        
        # URL remote
        remote = self._run_git_command(["remote", "get-url", "origin"])
        if remote:
            self.remote_url = remote.split('/')[-1].replace('.git', '') if remote.endswith('.git') else remote
        
        # Commits en avance/retard
        try:
            ahead = self._run_git_command(["rev-list", "--count", "HEAD@{upstream}..HEAD"])
            behind = self._run_git_command(["rev-list", "--count", "HEAD..HEAD@{upstream}"])
            if ahead is not None and behind is not None:
                self.ahead_behind = f"^{ahead} v{behind}"
        except:
            pass

class ConsoleRepoExplorer:
    def __init__(self, root_path=None):
        self.config = ConfigManager()
        self.root_path = root_path or self.config.get('default_repository_path')
        self.app_name = self.config.get('app_name', 'Git Repo Explorer')
        self.repos = []
        
    def _find_all_git_repos(self, root_path, current_path="", max_depth=None):
        """Trouve récursivement tous les repositories Git"""
        repos = []
        
        if max_depth is None:
            max_depth = self.config.get('max_scan_depth', 3)
        
        if current_path.count(os.sep) >= max_depth:
            return repos
            
        try:
            full_path = os.path.join(root_path, current_path) if current_path else root_path
            
            # Lister tous les éléments et les trier
            items = sorted([item for item in os.listdir(full_path) if not item.startswith('.')])
            
            # Séparer les repos Git directs des dossiers à explorer
            git_repos = []
            folders_to_explore = []
            
            for item in items:
                item_path = os.path.join(full_path, item)
                relative_path = os.path.join(current_path, item) if current_path else item
                
                if os.path.isdir(item_path):
                    if os.path.exists(os.path.join(item_path, ".git")):
                        print(f"  [+] Repository Git trouvé: {relative_path}")
                        repo_info = GitRepoInfo(item_path, relative_path)
                        git_repos.append(repo_info)
                    else:
                        folders_to_explore.append((item, item_path, relative_path))
            
            # Ajouter d'abord les repos Git du niveau actuel
            repos.extend(git_repos)
            
            # Puis explorer les dossiers et ajouter leurs contenus
            for item, item_path, relative_path in folders_to_explore:
                print(f"  [*] Analyse du dossier: {relative_path}")
                sub_repos = self._find_all_git_repos(root_path, relative_path, max_depth)
                
                # Si le dossier contient des repos Git, l'ajouter comme parent
                if sub_repos and any(repo.is_git_repo for repo in sub_repos):
                    folder_info = GitRepoInfo(item_path, relative_path)
                    repos.append(folder_info)  # Ajouter le parent
                    repos.extend(sub_repos)    # Puis ses enfants
                elif current_path.count(os.sep) < 1:  # Garder les dossiers de premier niveau même vides
                    folder_info = GitRepoInfo(item_path, relative_path)
                    repos.append(folder_info)
                        
        except Exception as e:
            print(f"[!] Erreur lors de l'analyse de {current_path}: {str(e)}")
            
        return repos
    
    def _load_repositories(self):
        print(">>> Analyse récursive des repositories en cours...")
        print("   (Scan jusqu'à 3 niveaux de profondeur)")
        
        self.repos = self._find_all_git_repos(self.root_path)
        
        git_repos_count = sum(1 for repo in self.repos if repo.is_git_repo)
        folder_count = len(self.repos) - git_repos_count
        print(f"\n>>> {git_repos_count} repositories Git trouvés • {folder_count} dossiers parents")
    
    def _print_table(self):
        # En-têtes
        headers = ["Repository", "Branche", "Statut", "Last Commit", "Date", "Sync", "Remote"]
        
        # Calculer les largeurs de colonnes
        widths = [len(h) for h in headers]
        
        for repo in self.repos:
            if repo.is_git_repo:
                # Afficher la hiérarchie avec indentation
                indent = "  " * repo.depth
                repo_name = f"📂 {indent}{repo.relative_path}"
                row_data = [
                    repo_name,
                    repo.current_branch,
                    repo.status,
                    repo.last_commit,
                    repo.last_commit_date,
                    repo.ahead_behind,
                    repo.remote_url
                ]
            else:
                # Dossier parent
                indent = "  " * repo.depth
                repo_name = f"📁 {indent}{repo.relative_path}"
                row_data = [
                    repo_name,
                    "-", "-", "-", "-", "-", "-"
                ]
            
            for i, cell in enumerate(row_data):
                if len(str(cell)) > widths[i]:
                    widths[i] = len(str(cell))
        
        # Limiter les largeurs maximales
        widths[0] = min(widths[0], 40)  # Repository name (plus large pour la hiérarchie)
        widths[2] = min(widths[2], 15)  # Status
        widths[3] = min(widths[3], 50)  # Last commit
        widths[6] = min(widths[6], 25)  # Remote
        
        # Imprimer les en-têtes
        print("\n" + "="*sum(widths) + "="*len(widths)*3)
        header_line = ""
        for i, header in enumerate(headers):
            header_line += f"| {header:<{widths[i]}} "
        header_line += "|"
        print(header_line)
        print("="*sum(widths) + "="*len(widths)*3)
        
        # Imprimer les données - Garder l'ordre hiérarchique existant
        # Ne pas trier pour préserver l'ordre parent->enfants
        for repo in self.repos:
            if repo.is_git_repo:
                indent = "  " * repo.depth
                repo_name = f"[GIT] {indent}{repo.relative_path}"[:widths[0]]
                row_data = [
                    repo_name,
                    repo.current_branch[:widths[1]],
                    repo.status[:widths[2]],
                    repo.last_commit[:widths[3]],
                    repo.last_commit_date[:widths[4]],
                    repo.ahead_behind[:widths[5]],
                    repo.remote_url[:widths[6]]
                ]
                # Colorier selon le statut
                status_color = "[OK]" if repo.status == "Clean" else "[MOD]" if "M:" in repo.status else "[?]"
                row_data[2] = f"{status_color} {row_data[2]}"
            else:
                indent = "  " * repo.depth
                repo_name = f"[DIR] {indent}{repo.relative_path}"[:widths[0]]
                row_data = [
                    repo_name,
                    "-", "-", "-", "-", "-", "-"
                ]
            
            row_line = ""
            for i, cell in enumerate(row_data):
                row_line += f"| {str(cell):<{widths[i]}} "
            row_line += "|"
            print(row_line)
        
        print("="*sum(widths) + "="*len(widths)*3)
        
        # Ajouter une légende détaillée
        self._print_legend()
    
    def _print_legend(self):
        """Affiche une légende explicative du tableau"""
        print(f"\n" + "="*80)
        print(f"*** LEGENDE ET EXPLICATION DES COLONNES ***")
        print(f"="*80)
        
        print(f"\n>>> STRUCTURE HIERARCHIQUE:")
        print(f"   [DIR] Dossier parent (contient des repositories)")
        print(f"   [GIT] Repository Git")
        print(f"   [GIT]     Repository Git imbrique (indente = dans un sous-dossier)")
        
        print(f"\n>>> COLONNES DU TABLEAU:")
        print(f"   [GIT] Repository → Nom du dossier/repository (avec hierarchie)")
        print(f"   Branche          → Branche Git actuellement active")
        print(f"   Statut           → Etat du working directory:")
        print(f"                      • Clean = Aucune modification")
        print(f"                      • M:X = X fichiers modifies")
        print(f"                      • A:X = X fichiers ajoutes (staged)")
        print(f"                      • U:X = X fichiers non trackes")
        print(f"   Last Commit      → Hash et message du dernier commit")
        print(f"   Date             → Date du dernier commit")
        print(f"   Sync             → Synchronisation avec origin:")
        print(f"                      • ^N = N commits en avance (a push)")
        print(f"                      • vN = N commits en retard (a pull)")
        print(f"   Remote           → Nom du repository distant")
        
        print(f"\n>>> CODES COULEUR:")
        print(f"   [OK]  = Repository propre (pas de modifications)")
        print(f"   [MOD] = Modifications non commitees")
        
        print(f"\n>>> EXEMPLES CONCRETS:")
        print(f"   [DIR] sales-maki                    → Dossier contenant 6 repositories")
        print(f"   [GIT]   sales-maki/kafka_ftp_facade → Repository dans le dossier sales-maki")
        print(f"   [OK] Clean                          → Tout est synchronise")
        print(f"   [MOD] M:3 A:1 U:2                  → 3 modifies, 1 ajoute, 2 non trackes")
        print(f"   ^2 v0                               → 2 commits a pusher, 0 a puller")
        
        print(f"\n" + "="*80)
    
    def run(self):
        print(f"*** {self.app_name} ***")
        print("=" * 60)
        
        self._load_repositories()
        self._print_table()
        
        print(f"\n*** Derniere analyse: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ***")
        
        # Option pour ouvrir un dossier - seulement si c'est interactif
        if sys.stdin.isatty():
            print(f"\n>>> Actions disponibles:")
            print(f"    Tapez le nom d'un repository pour l'ouvrir dans l'explorateur")
            print(f"    Tapez 'fetch' pour synchroniser tous les repositories")
            print(f"    Tapez 'q' pour quitter")
            
            while True:
                try:
                    user_input = input(f"\n> ").strip()
                    if user_input.lower() == 'q':
                        break
                    elif user_input.lower() == 'fetch':
                        self._fetch_all_repositories()
                    elif user_input:
                        self._open_repository(user_input)
                except (KeyboardInterrupt, EOFError):
                    print(f"\n\n*** Au revoir ! ***")
                    break
    
    def _open_repository(self, search_term):
        """Ouvre un repository dans l'explorateur de fichiers"""
        matches = [repo for repo in self.repos if search_term.lower() in repo.relative_path.lower()]
        
        if not matches:
            print(f"[!] Aucun repository trouve contenant '{search_term}'")
            return
        
        if len(matches) == 1:
            repo = matches[0]
            try:
                # Détecter si nous sommes dans WSL
                if os.path.exists('/proc/version'):
                    with open('/proc/version', 'r') as f:
                        version_content = f.read().lower()
                        if 'microsoft' in version_content or 'wsl' in version_content:
                            # WSL - convertir le chemin Linux vers Windows avec wslpath
                            try:
                                result = subprocess.run(["wslpath", "-w", repo.path], 
                                                      capture_output=True, text=True, check=True)
                                windows_path = result.stdout.strip()
                                subprocess.run(["explorer.exe", windows_path], check=False)
                                print(f"[>] Ouverture de {repo.relative_path} dans l'explorateur Windows...")
                                return
                            except subprocess.CalledProcessError:
                                # Fallback: utiliser le chemin direct
                                subprocess.run(["explorer.exe", repo.path], check=False)
                                print(f"[>] Ouverture de {repo.relative_path} dans l'explorateur Windows...")
                                return
                
                # Systèmes normaux
                if sys.platform == "win32":
                    os.startfile(repo.path)
                elif sys.platform == "darwin":
                    subprocess.run(["open", repo.path])
                else:
                    subprocess.run(["xdg-open", repo.path])
                    
                print(f"[>] Ouverture de {repo.relative_path} dans l'explorateur...")
            except Exception as e:
                print(f"[!] Impossible d'ouvrir le dossier: {str(e)}")
        else:
            print(f"[?] Plusieurs correspondances trouvees:")
            for i, repo in enumerate(matches[:5], 1):
                icon = "[GIT]" if repo.is_git_repo else "[DIR]"
                print(f"   {i}. {icon} {repo.relative_path}")
            
            if len(matches) > 5:
                print(f"   ... et {len(matches) - 5} autres")
                
            print(f"[!] Soyez plus precis dans votre recherche")
    
    def _fetch_all_repositories(self):
        """Effectue un fetch sur tous les repositories Git"""
        git_repos = [repo for repo in self.repos if repo.is_git_repo]
        
        if not git_repos:
            print(f"[!] Aucun repository Git trouve pour le fetch")
            return
            
        print(f"\n" + "="*80)
        print(f">>> FETCH ALL REPOSITORIES")
        print(f"="*80)
        print(f"\nSynchronisation de {len(git_repos)} repositories avec origin...")
        print(f"Timeout: 30s par repository | Appuyez sur Ctrl+C pour annuler\n")
        
        success_count = 0
        error_count = 0
        
        try:
            for i, repo in enumerate(git_repos, 1):
                print(f"[{i:2d}/{len(git_repos)}] Fetch: {repo.relative_path:<40} ", end="", flush=True)
                
                result = repo.fetch_from_remote()
                
                if result['success']:
                    success_count += 1
                    print("[+] OK")
                else:
                    error_count += 1
                    print(f"[!] ERREUR: {result['error']}")
                    
        except KeyboardInterrupt:
            print(f"\n\n[!] Fetch annule par l'utilisateur")
            print(f">>> Repositories traites: {success_count + error_count}/{len(git_repos)}")
            return
        
        print(f"\n" + "="*80)
        print(f">>> FETCH TERMINE")
        print(f"="*80)
        print(f"Succes: {success_count}")
        print(f"Erreurs: {error_count}")
        print(f"Total: {len(git_repos)} repositories")
        
        if success_count > 0:
            print(f"\n[+] Actualisation de l'affichage...")
            # Re-charger les données pour mettre à jour les informations de sync
            self._load_repositories()
            self._print_table()
            print(f"\n[+] Interface mise a jour avec les dernieres donnees!")
        
        print(f"\n" + "="*80)

def main():
    # Parse des arguments de ligne de commande
    parser = argparse.ArgumentParser(
        description="GitHub Repository Explorer (Console) - Explore et gère vos repositories Git",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemples d'utilisation:
  python3 console_repo_explorer.py                   # Utilise le chemin configuré
  python3 console_repo_explorer.py /path/to/repos    # Utilise un chemin spécifique
  python3 console_repo_explorer.py --config          # Affiche la configuration actuelle
        """
    )
    
    parser.add_argument(
        'path', 
        nargs='?', 
        help='Chemin vers le dossier contenant les repositories Git'
    )
    
    parser.add_argument(
        '--config', 
        action='store_true', 
        help='Affiche la configuration actuelle et quitte'
    )
    
    args = parser.parse_args()
    
    # Gérer l'option --config
    if args.config:
        config = ConfigManager()
        print("=== Configuration actuelle ===")
        print(json.dumps(config.config, indent=2, ensure_ascii=False))
        print(f"\nFichier de configuration: {os.path.abspath(config.config_file)}")
        return
    
    # Déterminer le chemin à utiliser
    config = ConfigManager()
    root_path = args.path or config.get('default_repository_path')
    
    # Vérifier que le chemin existe
    if not os.path.exists(root_path):
        print(f"❌ Erreur: Le chemin '{root_path}' n'existe pas.")
        print(f"\nSolutions:")
        print(f"• Vérifiez le chemin dans le fichier config.json")
        print(f"• Utilisez: python3 {sys.argv[0]} /chemin/vers/vos/repos")
        print(f"• Éditez manuellement le fichier config.json")
        sys.exit(1)
    
    print(f"🚀 Lancement de {config.get('app_name', 'Git Repo Explorer')} (Console)")
    print(f"📁 Dossier à explorer: {root_path}")
    
    explorer = ConsoleRepoExplorer(root_path)
    explorer.run()

if __name__ == "__main__":
    main()