# 🖥️ Créer un raccourci bureau pour Kering Repo Explorer

## 🚀 Méthode Automatique (Recommandée)

### Étape 1 : Ouvrir PowerShell en tant qu'Administrateur
1. **Clic droit** sur le bouton Démarrer Windows
2. Sélectionner **"Windows PowerShell (Admin)"** ou **"Terminal (Admin)"**
3. Confirmer avec **"Oui"** dans la fenêtre UAC

### Étape 2 : Naviguer vers le dossier
```powershell
cd "\\wsl.localhost\Ubuntu\home\yjaffres\www\kering\pytool"
```

### Étape 3 : Exécuter le script d'installation
```powershell
.\setup_desktop_shortcut.bat
```

**✅ C'est tout !** Le raccourci sera créé automatiquement sur votre bureau.

---

## 🔧 Méthode Alternative (Si la première ne fonctionne pas)

### Option A : Via l'Explorateur Windows
1. Ouvrir l'Explorateur Windows
2. Aller à : `\\wsl.localhost\Ubuntu\home\yjaffres\www\kering\pytool`
3. **Double-cliquer** sur `setup_desktop_shortcut.bat`

### Option B : Créer manuellement
1. **Clic droit** sur le bureau → **"Nouveau"** → **"Raccourci"**
2. Dans "Emplacement" :
   ```
   \\wsl.localhost\Ubuntu\home\yjaffres\www\kering\pytool\launch_kering_explorer.bat
   ```
3. Nommer le raccourci : **"Kering Repo Explorer"**
4. **Terminer**

---

## 🎯 Utilisation du raccourci

Une fois créé, **double-cliquez** sur le raccourci **"Kering Repo Explorer"** sur votre bureau.

### Ce qui va se passer :
1. ✅ Une fenêtre de terminal s'ouvre
2. ✅ L'application se lance automatiquement
3. ✅ Vous verrez soit :
   - **Interface graphique** (si tkinter installé)
   - **Interface console** (fallback)

---

## 🛠️ Dépannage

### Problème : "WSL non trouvé"
**Solution :** Assurez-vous que WSL Ubuntu est installé et démarré
```cmd
wsl --list --verbose
```

### Problème : "Fichier non trouvé"
**Solution :** Vérifiez que les fichiers existent :
```cmd
dir "\\wsl.localhost\Ubuntu\home\yjaffres\www\kering\pytool"
```

### Problème : "Permission refusée"
**Solution :** Exécutez PowerShell en tant qu'administrateur

---

## 📋 Fichiers créés

- **`launch_kering_explorer.bat`** : Script de lancement Windows → WSL
- **`setup_desktop_shortcut.bat`** : Installation automatique du raccourci  
- **`create_desktop_shortcut.ps1`** : Script PowerShell alternatif

---

## ✨ Personnalisation

Vous pouvez **clic droit** → **"Propriétés"** sur le raccourci pour :
- 🎨 Changer l'icône
- ⚡ Modifier le raccourci clavier
- 🖼️ Personnaliser la fenêtre

---

**🎉 Profitez de votre GitHub Repository Explorer directement depuis le bureau !**