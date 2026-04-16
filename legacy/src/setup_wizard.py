#!/usr/bin/env python3
"""
RepoScan - Assistant de configuration (premier lancement).

Ce script est appelé automatiquement par launch_explorer.sh quand config/config.json
n'existe pas. Il détecte les valeurs de l'environnement et demande confirmation à l'utilisateur.
"""

import json
import os
import subprocess
import sys
from pathlib import Path


# ─── Auto-détection ────────────────────────────────────────────────────────────

def detect_wsl_distro() -> str:
    """Retourne le nom de la distro WSL courante, ou 'Ubuntu' par défaut."""
    # WSL2 expose cette variable d'environnement
    distro = os.environ.get("WSL_DISTRO_NAME", "").strip()
    if distro:
        return distro
    return "Ubuntu"


def detect_project_root() -> str:
    """Retourne le chemin racine du projet (parent de src/)."""
    return str(Path(__file__).resolve().parent.parent)


def detect_repo_path() -> str:
    """Propose un chemin pour les repositories Git.
    Cherche ~/www, ~/projects, ~/repos, ~/dev — retourne le premier qui existe.
    Sinon retourne $HOME.
    """
    home = Path.home()
    for candidate in ["www", "projects", "repos", "dev"]:
        p = home / candidate
        if p.is_dir():
            return str(p)
    return str(home)


def load_example_config(project_root: str) -> dict:
    """Charge config.example.json depuis le projet."""
    example_path = Path(project_root) / "config" / "config.example.json"
    if example_path.exists():
        with open(example_path, "r", encoding="utf-8") as f:
            return json.load(f)
    # Fallback si le fichier example n'existe pas
    return {
        "app_name": "RepoScan",
        "shortcut_name": "RepoScan",
        "default_repository_path": "",
        "max_scan_depth": 3,
        "fetch_timeout_seconds": 30,
        "gui_window_size": "1400x1000",
        "show_empty_folders": True,
        "windows": {"distro": "", "linux_project_path": ""},
    }


def build_defaults(project_root: str) -> dict:
    """Construit les valeurs par défaut en appliquant l'auto-détection sur le template."""
    config = load_example_config(project_root)
    # Remplacer les valeurs vides/génériques par les valeurs auto-détectées
    config["default_repository_path"] = detect_repo_path()
    config.setdefault("windows", {})
    config["windows"]["distro"] = detect_wsl_distro()
    config["windows"]["linux_project_path"] = project_root
    return config


# ─── Wizard console ─────────────────────────────────────────────────────────────

def _prompt(label: str, default: str) -> str:
    """Affiche un prompt avec valeur par défaut. Retourne la valeur saisie ou le défaut."""
    try:
        answer = input(f"  {label} [{default}] > ").strip()
        return answer if answer else default
    except (EOFError, KeyboardInterrupt):
        raise


def run_console_wizard(defaults: dict) -> dict | None:
    """Lance le wizard en mode console. Retourne la config ou None si annulé."""
    sep = "═" * 50
    print(f"\n{sep}")
    print("  RepoScan - Configuration initiale")
    print(sep)
    print("  Appuyez sur Entrée pour accepter la valeur par défaut.\n")

    try:
        repo_path = _prompt(
            "Chemin de vos repositories Git",
            defaults.get("default_repository_path", str(Path.home())),
        )
        distro = _prompt(
            "Distribution WSL (ex: Ubuntu, Ubuntu-22.04)",
            defaults.get("windows", {}).get("distro", "Ubuntu"),
        )
        max_depth = _prompt(
            "Profondeur max de scan (1-10)",
            str(defaults.get("max_scan_depth", 3)),
        )
        fetch_timeout = _prompt(
            "Timeout git fetch en secondes",
            str(defaults.get("fetch_timeout_seconds", 30)),
        )
        window_size = _prompt(
            "Taille fenêtre GUI (largeurxhauteur)",
            defaults.get("gui_window_size", "1400x1000"),
        )
        show_empty_raw = _prompt(
            "Afficher les dossiers vides ? (o/n)",
            "o" if defaults.get("show_empty_folders", True) else "n",
        )
    except KeyboardInterrupt:
        print("\n\nConfiguration annulée.")
        return None

    # Validation basique
    try:
        max_depth_int = max(1, min(10, int(max_depth)))
    except ValueError:
        max_depth_int = 3
    try:
        fetch_timeout_int = max(5, int(fetch_timeout))
    except ValueError:
        fetch_timeout_int = 30
    show_empty = show_empty_raw.lower() not in ("n", "non", "no", "0", "false")

    config = dict(defaults)
    config["default_repository_path"] = repo_path
    config["max_scan_depth"] = max_depth_int
    config["fetch_timeout_seconds"] = fetch_timeout_int
    config["gui_window_size"] = window_size
    config["show_empty_folders"] = show_empty
    config.setdefault("windows", {})
    config["windows"]["distro"] = distro
    config["windows"]["linux_project_path"] = defaults.get("windows", {}).get("linux_project_path", "")

    return config


# ─── Wizard GUI ─────────────────────────────────────────────────────────────────

def run_gui_wizard(defaults: dict) -> dict | None:
    """Lance le wizard en mode GUI (tkinter). Retourne la config ou None si annulé."""
    import tkinter as tk
    from tkinter import ttk, filedialog, messagebox

    result: dict | None = None

    root = tk.Tk()
    root.title("RepoScan - Configuration")
    root.resizable(False, False)

    # ── Centrer la fenêtre
    root.update_idletasks()
    width, height = 520, 360
    x = (root.winfo_screenwidth() - width) // 2
    y = (root.winfo_screenheight() - height) // 2
    root.geometry(f"{width}x{height}+{x}+{y}")

    pad = {"padx": 10, "pady": 4}

    frame = ttk.Frame(root, padding=16)
    frame.pack(fill="both", expand=True)

    ttk.Label(frame, text="Configuration initiale de RepoScan", font=("", 12, "bold")).grid(
        row=0, column=0, columnspan=3, pady=(0, 12), sticky="w"
    )

    fields = [
        ("Chemin de vos repositories Git", "default_repository_path", True),
        ("Distribution WSL", "windows.distro", False),
        ("Profondeur max de scan", "max_scan_depth", False),
        ("Timeout git fetch (secondes)", "fetch_timeout_seconds", False),
        ("Taille fenêtre GUI", "gui_window_size", False),
    ]

    entries: dict[str, tk.StringVar] = {}

    def get_default(key: str) -> str:
        parts = key.split(".")
        val = defaults
        for p in parts:
            if isinstance(val, dict):
                val = val.get(p, "")
            else:
                val = ""
        return str(val)

    for row, (label, key, has_browse) in enumerate(fields, start=1):
        ttk.Label(frame, text=label + " :").grid(row=row, column=0, sticky="w", **pad)
        var = tk.StringVar(value=get_default(key))
        entries[key] = var
        ttk.Entry(frame, textvariable=var, width=36).grid(row=row, column=1, sticky="ew", **pad)
        if has_browse:
            def browse(v=var):
                path = filedialog.askdirectory(title="Choisir le dossier des repositories")
                if path:
                    v.set(path)
            ttk.Button(frame, text="…", width=3, command=browse).grid(row=row, column=2, **pad)

    show_empty_var = tk.BooleanVar(value=defaults.get("show_empty_folders", True))
    ttk.Checkbutton(frame, text="Afficher les dossiers vides", variable=show_empty_var).grid(
        row=len(fields) + 1, column=0, columnspan=2, sticky="w", padx=10, pady=4
    )

    ttk.Label(
        frame,
        text="Ces paramètres sont modifiables dans config/config.json",
        foreground="gray",
        font=("", 8),
    ).grid(row=len(fields) + 2, column=0, columnspan=3, sticky="w", padx=10, pady=(8, 0))

    btn_frame = ttk.Frame(frame)
    btn_frame.grid(row=len(fields) + 3, column=0, columnspan=3, pady=(12, 0))

    def on_save():
        nonlocal result
        config = dict(defaults)
        config["default_repository_path"] = entries["default_repository_path"].get().strip()
        try:
            config["max_scan_depth"] = max(1, min(10, int(entries["max_scan_depth"].get())))
        except ValueError:
            config["max_scan_depth"] = 3
        try:
            config["fetch_timeout_seconds"] = max(5, int(entries["fetch_timeout_seconds"].get()))
        except ValueError:
            config["fetch_timeout_seconds"] = 30
        config["gui_window_size"] = entries["gui_window_size"].get().strip()
        config["show_empty_folders"] = show_empty_var.get()
        config.setdefault("windows", {})
        config["windows"]["distro"] = entries["windows.distro"].get().strip()
        config["windows"]["linux_project_path"] = defaults.get("windows", {}).get("linux_project_path", "")
        result = config
        root.destroy()

    def on_cancel():
        root.destroy()

    ttk.Button(btn_frame, text="Sauvegarder & Lancer", command=on_save).pack(side="left", padx=6)
    ttk.Button(btn_frame, text="Annuler", command=on_cancel).pack(side="left", padx=6)

    root.protocol("WM_DELETE_WINDOW", on_cancel)
    root.mainloop()

    return result


# ─── Point d'entrée ─────────────────────────────────────────────────────────────

def main():
    project_root = detect_project_root()
    config_path = Path(project_root) / "config" / "config.json"

    # Déjà configuré : sortie silencieuse
    if config_path.exists():
        sys.exit(0)

    defaults = build_defaults(project_root)

    # Choisir le mode : GUI si tkinter + display disponible, sinon console
    config = None
    gui_available = False
    try:
        import tkinter  # noqa: F401
        if os.environ.get("DISPLAY") or os.environ.get("WAYLAND_DISPLAY"):
            gui_available = True
    except ImportError:
        pass

    if gui_available:
        config = run_gui_wizard(defaults)
    else:
        config = run_console_wizard(defaults)

    if config is None:
        sys.exit(1)

    # Sauvegarder
    config_path.parent.mkdir(parents=True, exist_ok=True)
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)

    print(f"\nConfiguration sauvegardée dans {config_path}")


if __name__ == "__main__":
    main()
