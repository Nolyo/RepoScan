# Application Icons

## Comment ajouter une icône personnalisée

1. **Créez ou obtenez votre icône** :
   - Format recommandé : `.ico` (Windows) ou `.png` 
   - Taille recommandée : 32x32 ou 64x64 pixels
   - Nom : `app_icon.ico` ou `app_icon.png`

2. **Placez le fichier dans ce dossier** :
   ```
   assets/icons/app_icon.ico
   ```

3. **L'icône sera automatiquement utilisée** :
   - Dans la barre des tâches quand l'application tkinter est ouverte
   - Pour le raccourci bureau Windows
   - Les scripts chercheront dans l'ordre : `app_icon`, `icon`, `logo`

## Comment changer d'icône

1. **Si vous avez un PNG** (ex: depuis ChatGPT) :
   - Placez votre PNG ici : `assets/icons/app_icon.png`
   - Convertissez-le en ICO : `python3 scripts/convert_png_to_ico.py`
   - Recréez le raccourci : `@scripts/windows/setup_desktop_shortcut.bat`

2. **Si vous avez déjà un ICO** :
   - Remplacez directement : `assets/icons/app_icon.ico`
   - Recréez le raccourci si nécessaire

## Formats supportés

- **Application Python** : `.ico`, `.png`, `.gif`, `.bmp`
- **Raccourcis Windows** : `.ico` (recommandé)

## Ressources pour créer des icônes

- **Outils gratuits** :
  - GIMP (avec plugin ICO)
  - Paint.NET (avec plugin ICO)
  - Online: favicon.io, icoconvert.com

- **IA générative** :
  - DALL-E, Midjourney, Stable Diffusion
  - Prompt suggéré : "Simple flat icon for a git repository explorer application, professional, clean design, 32x32 pixels"

## Fallback

Si aucune icône personnalisée n'est trouvée :
- **Application** : Utilise l'icône par défaut de tkinter
- **Raccourci** : Utilise l'icône Windows Terminal ou cmd.exe