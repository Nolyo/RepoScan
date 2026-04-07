#!/usr/bin/env python3

import os
import json
import shutil
from pathlib import Path


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
                "app_name": "RepoScan",
                "shortcut_name": "RepoScan",
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
