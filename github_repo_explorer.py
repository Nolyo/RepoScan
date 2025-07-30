#!/usr/bin/env python3

import os
import sys
import subprocess
import tkinter as tk
from tkinter import ttk, messagebox
from datetime import datetime
import json
from pathlib import Path

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
            self.last_commit = commit[:50] + "..." if len(commit) > 50 else commit
        
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
            self.remote_url = remote
        
        # Commits en avance/retard
        try:
            ahead = self._run_git_command(["rev-list", "--count", "HEAD@{upstream}..HEAD"])
            behind = self._run_git_command(["rev-list", "--count", "HEAD..HEAD@{upstream}"])
            if ahead is not None and behind is not None:
                self.ahead_behind = f"^{ahead} v{behind}"
        except:
            pass

class GitRepoExplorer:
    def __init__(self, root_path):
        self.root_path = root_path
        self.root = tk.Tk()
        self.root.title("GitHub Repository Explorer - Kering")
        self.root.geometry("1400x800")
        self.root.configure(bg='#f0f0f0')
        
        self.repos = []
        self.filtered_repos = []
        
        self._setup_ui()
        self._load_repositories()
    
    def _setup_ui(self):
        # Style configuration
        style = ttk.Style()
        style.theme_use('clam')
        
        # Barre de titre
        title_frame = tk.Frame(self.root, bg='#2c3e50', height=60)
        title_frame.pack(fill='x', padx=0, pady=0)
        title_frame.pack_propagate(False)
        
        title_label = tk.Label(
            title_frame, 
            text="*** GitHub Repository Explorer - Kering Projects ***",
            font=('Segoe UI', 16, 'bold'),
            fg='white',
            bg='#2c3e50'
        )
        title_label.pack(pady=15)
        
        # Barre de recherche
        search_frame = tk.Frame(self.root, bg='#ecf0f1', height=50)
        search_frame.pack(fill='x', padx=10, pady=5)
        search_frame.pack_propagate(False)
        
        tk.Label(search_frame, text=">>> Rechercher:", bg='#ecf0f1', font=('Segoe UI', 10)).pack(side='left', padx=(10, 5), pady=15)
        
        self.search_var = tk.StringVar()
        self.search_var.trace('w', self._on_search)
        search_entry = tk.Entry(search_frame, textvariable=self.search_var, font=('Segoe UI', 10), width=40)
        search_entry.pack(side='left', padx=5, pady=10)
        
        # Boutons
        refresh_btn = tk.Button(
            search_frame, 
            text=">>> Actualiser",
            command=self._refresh_repositories,
            bg='#3498db',
            fg='white',
            font=('Segoe UI', 9),
            relief='flat',
            padx=15
        )
        refresh_btn.pack(side='right', padx=10, pady=10)
        
        help_btn = tk.Button(
            search_frame, 
            text=">>> Aide",
            command=self._show_help,
            bg='#27ae60',
            fg='white',
            font=('Segoe UI', 9),
            relief='flat',
            padx=15
        )
        help_btn.pack(side='right', padx=5, pady=10)
        
        fetch_btn = tk.Button(
            search_frame, 
            text=">>> Fetch All",
            command=self._fetch_all_repositories,
            bg='#e67e22',
            fg='white',
            font=('Segoe UI', 9),
            relief='flat',
            padx=15
        )
        fetch_btn.pack(side='right', padx=5, pady=10)
        
        # Frame principal
        main_frame = tk.Frame(self.root, bg='#f0f0f0')
        main_frame.pack(fill='both', expand=True, padx=10, pady=5)
        
        # Treeview avec scrollbars
        tree_frame = tk.Frame(main_frame)
        tree_frame.pack(fill='both', expand=True)
        
        # Colonnes
        columns = ('name', 'branch', 'status', 'last_commit', 'date', 'ahead_behind', 'remote')
        self.tree = ttk.Treeview(tree_frame, columns=columns, show='headings', height=20)
        
        # Configuration des colonnes
        self.tree.heading('name', text='📁 Repository')
        self.tree.heading('branch', text='🌿 Branche')
        self.tree.heading('status', text='📊 Statut')
        self.tree.heading('last_commit', text='💬 Dernier Commit')
        self.tree.heading('date', text='📅 Date')
        self.tree.heading('ahead_behind', text='↕️ Sync')
        self.tree.heading('remote', text='🌐 Remote')
        
        self.tree.column('name', width=250, minwidth=200)
        self.tree.column('branch', width=120, minwidth=100)
        self.tree.column('status', width=100, minwidth=80)
        self.tree.column('last_commit', width=300, minwidth=200)
        self.tree.column('date', width=100, minwidth=80)
        self.tree.column('ahead_behind', width=80, minwidth=60)
        self.tree.column('remote', width=200, minwidth=150)
        
        # Scrollbars
        v_scrollbar = ttk.Scrollbar(tree_frame, orient='vertical', command=self.tree.yview)
        h_scrollbar = ttk.Scrollbar(tree_frame, orient='horizontal', command=self.tree.xview)
        self.tree.configure(yscrollcommand=v_scrollbar.set, xscrollcommand=h_scrollbar.set)
        
        # Pack treeview et scrollbars
        self.tree.grid(row=0, column=0, sticky='nsew')
        v_scrollbar.grid(row=0, column=1, sticky='ns')
        h_scrollbar.grid(row=1, column=0, sticky='ew')
        
        tree_frame.grid_rowconfigure(0, weight=1)
        tree_frame.grid_columnconfigure(0, weight=1)
        
        # Bind double-click et clic droit
        self.tree.bind('<Double-1>', self._on_double_click)
        self.tree.bind('<Button-3>', self._on_right_click)  # Clic droit
        
        # Raccourcis clavier
        self.tree.bind('<Control-Return>', self._on_ctrl_enter)  # Ctrl+Enter = VS Code
        self.tree.bind('<Control-c>', self._on_ctrl_c)  # Ctrl+C = Copier chemin
        self.tree.focus_set()  # Permettre au treeview de recevoir les événements clavier
        
        # Barre de statut
        status_frame = tk.Frame(self.root, bg='#34495e', height=30)
        status_frame.pack(fill='x', side='bottom')
        status_frame.pack_propagate(False)
        
        self.status_label = tk.Label(
            status_frame, 
            text="Chargement...",
            bg='#34495e',
            fg='white',
            font=('Segoe UI', 9)
        )
        self.status_label.pack(side='left', padx=10, pady=5)
    
    def _find_all_git_repos(self, root_path, current_path="", max_depth=3):
        """Trouve récursivement tous les repositories Git"""
        repos = []
        
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
                        repo_info = GitRepoInfo(item_path, relative_path)
                        git_repos.append(repo_info)
                    else:
                        folders_to_explore.append((item, item_path, relative_path))
            
            # Ajouter d'abord les repos Git du niveau actuel
            repos.extend(git_repos)
            
            # Puis explorer les dossiers et ajouter leurs contenus
            for item, item_path, relative_path in folders_to_explore:
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
            print(f"Erreur lors de l'analyse de {current_path}: {str(e)}")
            
        return repos
    
    def _load_repositories(self):
        self.status_label.config(text="Analyse récursive des repositories en cours...")
        self.root.update()
        
        self.repos = self._find_all_git_repos(self.root_path)
        
        self.filtered_repos = self.repos[:]
        self._update_tree()
        
        git_repos_count = sum(1 for repo in self.repos if repo.is_git_repo)
        folder_count = len(self.repos) - git_repos_count
        clean_repos = sum(1 for repo in self.repos if repo.is_git_repo and repo.status == "Clean")
        modified_repos = sum(1 for repo in self.repos if repo.is_git_repo and "M:" in repo.status)
        
        self.status_label.config(
            text=f">>> {git_repos_count} repos Git ({clean_repos}[OK] {modified_repos}[MOD]) | {folder_count} dossiers | Maj: {datetime.now().strftime('%H:%M:%S')} | Double-clic pour ouvrir"
        )
    
    def _update_tree(self):
        # Vider le tree
        for item in self.tree.get_children():
            self.tree.delete(item)
        
        # Ajouter les repositories - Garder l'ordre hiérarchique
        for repo in self.filtered_repos:
            icon = "[DIR]" if not repo.is_git_repo else "[GIT]"
            indent = "  " * repo.depth
            
            # Couleur selon le statut
            tags = []
            if repo.is_git_repo:
                if repo.status == "Clean":
                    tags = ['clean']
                elif "M:" in repo.status:
                    tags = ['modified']
            
            self.tree.insert('', 'end', values=(
                f"{icon} {indent}{repo.relative_path}",
                repo.current_branch,
                repo.status,
                repo.last_commit,
                repo.last_commit_date,
                repo.ahead_behind,
                repo.remote_url.split('/')[-1].replace('.git', '') if repo.remote_url != "N/A" else "N/A"
            ), tags=tags)
        
        # Configuration des tags
        self.tree.tag_configure('clean', background='#d5f4e6')
        self.tree.tag_configure('modified', background='#ffeaa7')
    
    def _on_search(self, *args):
        search_term = self.search_var.get().lower()
        if not search_term:
            self.filtered_repos = self.repos[:]
        else:
            self.filtered_repos = [
                repo for repo in self.repos 
                if search_term in repo.relative_path.lower() or 
                   search_term in repo.current_branch.lower() or
                   search_term in repo.last_commit.lower()
            ]
        self._update_tree()
    
    def _on_double_click(self, event):
        selection = self.tree.selection()
        if selection:
            values = self.tree.item(selection[0])['values']
            repo_display_name = values[0]
            
            # Extraire le chemin relatif en enlevant l'icône et l'indentation
            parts = repo_display_name.split(' ')
            relative_path = ' '.join(parts[1:]).strip()
            repo_path = os.path.join(self.root_path, relative_path)
            
            try:
                # Détecter si nous sommes dans WSL
                if os.path.exists('/proc/version'):
                    with open('/proc/version', 'r') as f:
                        version_content = f.read().lower()
                        if 'microsoft' in version_content or 'wsl' in version_content:
                            # WSL - convertir le chemin Linux vers Windows avec wslpath
                            try:
                                result = subprocess.run(["wslpath", "-w", repo_path], 
                                                      capture_output=True, text=True, check=True)
                                windows_path = result.stdout.strip()
                                subprocess.run(["explorer.exe", windows_path], check=False)
                                return
                            except subprocess.CalledProcessError:
                                # Fallback: utiliser le chemin direct
                                subprocess.run(["explorer.exe", repo_path], check=False)
                                return
                
                # Systèmes normaux
                if sys.platform == "win32":
                    os.startfile(repo_path)
                elif sys.platform == "darwin":
                    subprocess.run(["open", repo_path])
                else:
                    # Linux natif
                    subprocess.run(["xdg-open", repo_path])
            except Exception as e:
                messagebox.showerror("Erreur", f"Impossible d'ouvrir le dossier: {str(e)}")
    
    def _on_right_click(self, event):
        """Gère le clic droit pour afficher le menu contextuel"""
        selection = self.tree.selection()
        if not selection:
            return
        
        # Sélectionner l'item sous le curseur
        item = self.tree.identify('item', event.x, event.y)
        if item:
            self.tree.selection_set(item)
            self._show_context_menu(event, item)
    
    def _show_context_menu(self, event, item):
        """Affiche le menu contextuel avec les options d'ouverture"""
        values = self.tree.item(item)['values']
        repo_display_name = values[0]
        
        # Extraire le chemin relatif
        parts = repo_display_name.split(' ')
        relative_path = ' '.join(parts[1:]).strip()
        repo_path = os.path.join(self.root_path, relative_path)
        
        # Créer le menu contextuel
        context_menu = tk.Menu(self.root, tearoff=0)
        
        # Option 1: Ouvrir dans l'Explorateur
        context_menu.add_command(
            label="📁 Ouvrir dans l'Explorateur",
            command=lambda: self._open_in_explorer(repo_path)
        )
        
        # Option 2: Ouvrir dans VS Code
        context_menu.add_command(
            label="💻 Ouvrir dans VS Code",
            command=lambda: self._open_in_vscode(repo_path)
        )
        
        context_menu.add_separator()
        
        # Option 3: Copier le chemin
        context_menu.add_command(
            label="📋 Copier le chemin",
            command=lambda: self._copy_path_to_clipboard(repo_path)
        )
        
        # Option 4: Copier la commande VS Code
        context_menu.add_command(
            label="⌨️ Copier commande 'code'",
            command=lambda: self._copy_vscode_command(repo_path)
        )
        
        # Afficher le menu à la position du clic
        try:
            context_menu.tk_popup(event.x_root, event.y_root)
        finally:
            context_menu.grab_release()
    
    def _open_in_explorer(self, repo_path):
        """Ouvre le repository dans l'Explorateur de fichiers"""
        try:
            # Détecter si nous sommes dans WSL
            if os.path.exists('/proc/version'):
                with open('/proc/version', 'r') as f:
                    version_content = f.read().lower()
                    if 'microsoft' in version_content or 'wsl' in version_content:
                        # WSL - convertir le chemin Linux vers Windows avec wslpath
                        try:
                            result = subprocess.run(["wslpath", "-w", repo_path], 
                                                  capture_output=True, text=True, check=True)
                            windows_path = result.stdout.strip()
                            subprocess.run(["explorer.exe", windows_path], check=False)
                            return
                        except subprocess.CalledProcessError:
                            # Fallback: utiliser le chemin direct
                            subprocess.run(["explorer.exe", repo_path], check=False)
                            return
            
            # Systèmes normaux
            if sys.platform == "win32":
                os.startfile(repo_path)
            elif sys.platform == "darwin":
                subprocess.run(["open", repo_path])
            else:
                # Linux natif
                subprocess.run(["xdg-open", repo_path])
                
        except Exception as e:
            messagebox.showerror("Erreur", f"Impossible d'ouvrir le dossier: {str(e)}")
    
    def _open_in_vscode(self, repo_path):
        """Ouvre le repository dans VS Code"""
        try:
            # Essayer d'abord avec 'code' (VS Code standard)
            result = subprocess.run(["code", repo_path], check=False, capture_output=True)
            
            # Si code n'est pas trouvé, essayer avec des alternatives
            if result.returncode != 0:
                # Essayer code-insiders
                result = subprocess.run(["code-insiders", repo_path], check=False, capture_output=True)
                
                if result.returncode != 0:
                    # WSL: essayer avec code.exe
                    result = subprocess.run(["code.exe", repo_path], check=False, capture_output=True)
                    
                    if result.returncode != 0:
                        messagebox.showwarning(
                            "VS Code introuvable", 
                            "VS Code n'est pas installé ou pas dans le PATH.\n\n"
                            "Solutions:\n"
                            "• Installer VS Code\n"
                            "• Ajouter 'code' au PATH\n"
                            "• Dans WSL: installer 'Remote - WSL' extension"
                        )
                        return
            
            messagebox.showinfo("Succès", f"Repository ouvert dans VS Code:\n{os.path.basename(repo_path)}")
                        
        except Exception as e:
            messagebox.showerror("Erreur", f"Impossible d'ouvrir VS Code: {str(e)}")
    
    def _copy_path_to_clipboard(self, repo_path):
        """Copie le chemin du repository dans le presse-papiers"""
        try:
            self.root.clipboard_clear()
            self.root.clipboard_append(repo_path)
            self.root.update()  # Force la mise à jour du clipboard
            messagebox.showinfo("Copié", f"Chemin copié dans le presse-papiers:\n{repo_path}")
        except Exception as e:
            messagebox.showerror("Erreur", f"Impossible de copier le chemin: {str(e)}")
    
    def _copy_vscode_command(self, repo_path):
        """Copie la commande 'code' dans le presse-papiers"""
        try:
            command = f"code \"{repo_path}\""
            self.root.clipboard_clear()
            self.root.clipboard_append(command)
            self.root.update()  # Force la mise à jour du clipboard
            messagebox.showinfo("Copié", f"Commande copiée dans le presse-papiers:\n{command}")
        except Exception as e:
            messagebox.showerror("Erreur", f"Impossible de copier la commande: {str(e)}")
    
    def _on_ctrl_enter(self, event):
        """Raccourci Ctrl+Enter pour ouvrir dans VS Code"""
        selection = self.tree.selection()
        if selection:
            values = self.tree.item(selection[0])['values']
            repo_display_name = values[0]
            
            # Extraire le chemin relatif
            parts = repo_display_name.split(' ')
            relative_path = ' '.join(parts[1:]).strip()
            repo_path = os.path.join(self.root_path, relative_path)
            
            self._open_in_vscode(repo_path)
    
    def _on_ctrl_c(self, event):
        """Raccourci Ctrl+C pour copier le chemin"""
        selection = self.tree.selection()
        if selection:
            values = self.tree.item(selection[0])['values']
            repo_display_name = values[0]
            
            # Extraire le chemin relatif
            parts = repo_display_name.split(' ')
            relative_path = ' '.join(parts[1:]).strip()
            repo_path = os.path.join(self.root_path, relative_path)
            
            self._copy_path_to_clipboard(repo_path)
    
    def _show_help(self):
        """Affiche une fenêtre d'aide avec la légende"""
        help_window = tk.Toplevel(self.root)
        help_window.title("Aide - GitHub Repository Explorer")
        help_window.geometry("800x600")
        help_window.configure(bg='#f8f9fa')
        
        # Scrollable text area
        text_frame = tk.Frame(help_window, bg='#f8f9fa')
        text_frame.pack(fill='both', expand=True, padx=20, pady=20)
        
        scrollbar = tk.Scrollbar(text_frame)
        scrollbar.pack(side='right', fill='y')
        
        help_text = tk.Text(
            text_frame,
            wrap='word',
            font=('Consolas', 10),
            bg='#ffffff',
            fg='#2c3e50',
            yscrollcommand=scrollbar.set,
            padx=15,
            pady=15
        )
        help_text.pack(fill='both', expand=True)
        scrollbar.config(command=help_text.yview)
        
        # Contenu de l'aide
        help_content = """*** GUIDE D'UTILISATION - GitHub Repository Explorer ***

>>> STRUCTURE HIERARCHIQUE:
   [DIR] Dossier parent (contient des repositories)
   [GIT] Repository Git
   [GIT]     Repository Git imbrique (indente = dans un sous-dossier)

>>> COLONNES DU TABLEAU:
   [GIT] Repository  -> Nom du dossier/repository (avec hierarchie)
   Branche           -> Branche Git actuellement active  
   Statut            -> Etat du working directory:
                        • Clean = Aucune modification
                        • M:X = X fichiers modifies
                        • A:X = X fichiers ajoutes (staged)
                        • U:X = X fichiers non trackes
   Last Commit       -> Hash et message du dernier commit
   Date              -> Date du dernier commit
   Sync              -> Synchronisation avec origin:
                        • ^N = N commits en avance (a push)
                        • vN = N commits en retard (a pull)
   Remote            -> Nom du repository distant

>>> CODES COULEUR:
   [OK]  = Repository propre (pas de modifications)
   [MOD] = Modifications non commitees

>>> ACTIONS DISPONIBLES:
   • Double-clic sur une ligne -> Ouvre le dossier dans l'explorateur
   • CLIC DROIT sur une ligne -> Menu contextuel avec options:
     ┌─ 📁 Ouvrir dans l'Explorateur
     ├─ 💻 Ouvrir dans VS Code
     ├─ 📋 Copier le chemin
     └─ ⌨️ Copier commande 'code'
   • RACCOURCIS CLAVIER:
     ├─ Ctrl+Enter -> Ouvrir dans VS Code
     └─ Ctrl+C -> Copier le chemin
   • Barre de recherche -> Filtre par nom, branche ou commit
   • Bouton Actualiser -> Recharge les informations
   • Bouton Fetch All -> Synchronise tous les repos avec origin

>>> EXEMPLES CONCRETS:
   [DIR] sales-maki                    -> Dossier contenant 6 repositories
   [GIT]   sales-maki/kafka_ftp_facade -> Repository dans le dossier sales-maki
   [OK] Clean                          -> Tout est synchronise
   [MOD] M:3 A:1 U:2                  -> 3 modifies, 1 ajoute, 2 non trackes
   ^2 v0                               -> 2 commits a pusher, 0 a puller

>>> COMPATIBILITE WSL:
   L'application detecte automatiquement WSL et convertit les chemins
   pour ouvrir correctement les dossiers dans l'Explorateur Windows.

>>> CONSEILS:
   • Utilisez la recherche pour filtrer les repositories
   • Les repositories imbriques sont indentes visuellement
   • Double-cliquez pour naviguer rapidement vers un dossier
   • Les couleurs vous aident a identifier l'etat rapidement"""
        
        help_text.insert('1.0', help_content)
        help_text.config(state='disabled')  # Lecture seule
        
        # Bouton fermer
        close_btn = tk.Button(
            help_window,
            text=">>> Fermer",
            command=help_window.destroy,
            bg='#e74c3c',
            fg='white',
            font=('Segoe UI', 10),
            relief='flat',
            padx=20,
            pady=5
        )
        close_btn.pack(pady=10)
    
    def _fetch_all_repositories(self):
        """Lance le fetch pour tous les repositories Git avec une fenêtre de progression"""
        git_repos = [repo for repo in self.repos if repo.is_git_repo]
        
        if not git_repos:
            messagebox.showinfo("Information", "Aucun repository Git trouvé à synchroniser.")
            return
        
        # Créer la fenêtre de progression
        progress_window = tk.Toplevel(self.root)
        progress_window.title("Fetch All Repositories")
        progress_window.geometry("600x400")
        progress_window.configure(bg='#f8f9fa')
        progress_window.transient(self.root)
        progress_window.grab_set()
        
        # Centrer la fenêtre
        progress_window.geometry("+{}+{}".format(
            self.root.winfo_rootx() + 50,
            self.root.winfo_rooty() + 50
        ))
        
        # Interface de la fenêtre de progression
        tk.Label(
            progress_window,
            text=">>> Synchronisation des repositories avec origin",
            font=('Segoe UI', 12, 'bold'),
            bg='#f8f9fa',
            fg='#2c3e50'
        ).pack(pady=10)
        
        # Barre de progression globale
        progress_frame = tk.Frame(progress_window, bg='#f8f9fa')
        progress_frame.pack(fill='x', padx=20, pady=10)
        
        tk.Label(progress_frame, text="Progression globale:", bg='#f8f9fa', font=('Segoe UI', 10)).pack(anchor='w')
        
        from tkinter import ttk
        global_progress = ttk.Progressbar(progress_frame, length=400, mode='determinate')
        global_progress.pack(fill='x', pady=5)
        
        global_progress['maximum'] = len(git_repos)
        
        # Label de statut
        status_label = tk.Label(
            progress_window,
            text=f"Preparation du fetch pour {len(git_repos)} repositories...",
            bg='#f8f9fa',
            font=('Segoe UI', 10)
        )
        status_label.pack(pady=5)
        
        # Zone de logs
        logs_frame = tk.Frame(progress_window, bg='#f8f9fa')
        logs_frame.pack(fill='both', expand=True, padx=20, pady=10)
        
        tk.Label(logs_frame, text="Détails:", bg='#f8f9fa', font=('Segoe UI', 10, 'bold')).pack(anchor='w')
        
        logs_text = tk.Text(
            logs_frame,
            height=12,
            font=('Consolas', 9),
            bg='#ffffff',
            fg='#2c3e50'
        )
        logs_scrollbar = tk.Scrollbar(logs_frame)
        logs_scrollbar.pack(side='right', fill='y')
        logs_text.pack(fill='both', expand=True)
        logs_text.config(yscrollcommand=logs_scrollbar.set)
        logs_scrollbar.config(command=logs_text.yview)
        
        # Boutons
        button_frame = tk.Frame(progress_window, bg='#f8f9fa')
        button_frame.pack(fill='x', padx=20, pady=10)
        
        cancel_btn = tk.Button(
            button_frame,
            text=">>> Annuler",
            bg='#e74c3c',
            fg='white',
            font=('Segoe UI', 9),
            relief='flat'
        )
        cancel_btn.pack(side='left')
        
        close_btn = tk.Button(
            button_frame,
            text=">>> Fermer",
            command=progress_window.destroy,
            bg='#95a5a6',
            fg='white',
            font=('Segoe UI', 9),
            relief='flat',
            state='disabled'
        )
        close_btn.pack(side='right')
        
        # Variables de contrôle
        cancelled = {'value': False}
        
        def cancel_operation():
            cancelled['value'] = True
            cancel_btn.config(state='disabled', text=">>> Annulation...")
            logs_text.insert('end', "\n[!] Annulation demandee...\n")
            logs_text.see('end')
        
        cancel_btn.config(command=cancel_operation)
        
        # Fonction pour effectuer le fetch en arrière-plan
        import threading
        
        def fetch_worker():
            success_count = 0
            error_count = 0
            
            for i, repo in enumerate(git_repos):
                if cancelled['value']:
                    break
                
                # Mettre à jour l'interface
                progress_window.after(0, lambda r=repo: status_label.config(
                    text=f"Fetch en cours: {r.relative_path}..."
                ))
                progress_window.after(0, lambda: logs_text.insert('end', f"\n[*] Fetch: {repo.relative_path}\n"))
                progress_window.after(0, lambda: logs_text.see('end'))
                
                # Effectuer le fetch
                result = repo.fetch_from_remote()
                
                if result['success']:
                    success_count += 1
                    progress_window.after(0, lambda r=repo: logs_text.insert('end', f"    [+] {r.relative_path}: OK\n"))
                else:
                    error_count += 1
                    progress_window.after(0, lambda r=repo, err=result['error']: logs_text.insert('end', f"    [!] {r.relative_path}: {err}\n"))
                
                # Mettre à jour la progression
                progress_window.after(0, lambda v=i+1: global_progress.config(value=v))
                progress_window.after(0, lambda: logs_text.see('end'))
            
            # Finaliser
            if cancelled['value']:
                final_msg = f"\n>>> Fetch annule apres {success_count + error_count}/{len(git_repos)} repositories"
            else:
                final_msg = f"\n>>> Fetch termine: {success_count} succes, {error_count} erreurs sur {len(git_repos)} repositories"
            
            progress_window.after(0, lambda: logs_text.insert('end', final_msg + "\n"))
            progress_window.after(0, lambda: logs_text.see('end'))
            progress_window.after(0, lambda: status_label.config(text="Fetch terminé - Actualisation des données..."))
            
            # Actualiser l'affichage principal
            progress_window.after(0, self._load_repositories)
            
            # Réactiver le bouton fermer
            progress_window.after(0, lambda: close_btn.config(state='normal'))
            progress_window.after(0, lambda: cancel_btn.config(state='disabled'))
            progress_window.after(0, lambda: status_label.config(text=f"Terminé: {success_count} succès, {error_count} erreurs"))
        
        # Lancer le thread de fetch
        fetch_thread = threading.Thread(target=fetch_worker, daemon=True)
        fetch_thread.start()
    
    def _refresh_repositories(self):
        self._load_repositories()
    
    def run(self):
        self.root.mainloop()

def main():
    root_path = "/home/yjaffres/www/kering"
    
    if not os.path.exists(root_path):
        print(f"Erreur: Le chemin {root_path} n'existe pas.")
        sys.exit(1)
    
    app = GitRepoExplorer(root_path)
    app.run()

if __name__ == "__main__":
    main()