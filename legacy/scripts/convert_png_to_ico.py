#!/usr/bin/env python3
"""
Script pour convertir app_icon.png en app_icon.ico
"""

import sys
from pathlib import Path
from PIL import Image

def convert_png_to_ico():
    """Convert PNG to ICO format"""
    # Chemin vers les assets
    project_root = Path(__file__).parent.parent
    icons_dir = project_root / 'assets' / 'icons'
    
    png_path = icons_dir / 'app_icon.png'
    ico_path = icons_dir / 'app_icon.ico'
    
    if not png_path.exists():
        print(f"❌ PNG non trouvé : {png_path}")
        return False
        
    try:
        # Ouvrir le PNG
        img = Image.open(png_path)
        
        # Pour un ICO compatible Windows, convertir en RGB avec fond blanc
        if img.mode in ('RGBA', 'LA'):
            # Créer un fond blanc pour remplacer la transparence
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'RGBA':
                background.paste(img, mask=img.split()[3])  # Utiliser le canal alpha
            else:
                background.paste(img, mask=img.split()[1])  # Utiliser le canal alpha de LA
            img = background
        elif img.mode != 'RGB':
            img = img.convert('RGB')
            
        # Redimensionner si nécessaire (ICO standard : multiples tailles)
        sizes_to_create = []
        if img.size != (16, 16):
            sizes_to_create.append((16, 16))
        if img.size != (32, 32):
            sizes_to_create.append((32, 32))
        if img.size != (48, 48):
            sizes_to_create.append((48, 48))
            
        # Si l'image n'est dans aucune taille standard, ajouter 32x32
        if not sizes_to_create:
            sizes_to_create = [(32, 32)]
            
        print(f"🔧 Création des tailles : {sizes_to_create}")
            
        # Sauver en ICO avec multiples tailles (plus compatible)
        # Utiliser append_images pour forcer le format bitmap au lieu de PNG intégré
        images = []
        for size in sizes_to_create:
            resized = img.resize(size, Image.Resampling.LANCZOS)
            images.append(resized)
        
        if images:
            # Sauver la première image comme base et ajouter les autres
            images[0].save(ico_path, format='ICO', append_images=images[1:] if len(images) > 1 else [])
        
        print(f"✅ Conversion réussie !")
        print(f"📁 PNG : {png_path}")
        print(f"📁 ICO : {ico_path}")
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors de la conversion : {e}")
        return False

if __name__ == "__main__":
    success = convert_png_to_ico()
    sys.exit(0 if success else 1)