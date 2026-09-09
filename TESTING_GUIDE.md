# 🎮 Guide de Test - Home Audiva

## ✅ Tests à Effectuer

### 1. **Carrousels**
- [ ] Cliquer sur les flèches gauche/droite des albums
- [ ] Flèches doivent défiler les cartes de manière fluide
- [ ] Drag & drop sur desktop fonctionne

### 2. **Boutons Play**
- [ ] Cliquer Play sur n'importe quelle chanson → lecteur démarre
- [ ] La pochette change dans le lecteur
- [ ] Le titre/artiste s'affichent
- [ ] Cliquer Play à nouveau → pause

### 3. **Système de Favoris**
- [ ] Cliquer le cœur 💖 sur une chanson → devient 💕
- [ ] Au refresh → les favoris sont toujours là
- [ ] Les cartes affichent ✓ pour les favoris

### 4. **Hover Effects**
- [ ] Survoler une carte album → scale et glow
- [ ] Boutons Play/Favoris/Menu apparaissent
- [ ] Survoler artiste → ring autour du cercle
- [ ] Survoler track → background se change

### 5. **Sections**
- [ ] Voir tout les sections se chargent
- [ ] Top Albums visible
- [ ] Top Artistes visible
- [ ] Top 30 avec badges UP/DOWN/NEW
- [ ] Genres Section explorable
- [ ] Statistiques d'écoute affichées

### 6. **Menu Contextuel**
- [ ] Cliquer "..." sur une piste
- [ ] Menu apparaît avec options
- [ ] Cliquer option → menu ferme
- [ ] Cliquer en dehors → menu ferme

### 7. **Responsive**
- [ ] Desktop (1440px) : 4-6 items par carrousel
- [ ] Tablet (768px) : réduction adaptée
- [ ] Mobile (375px) : scroll horizontal fonctionnel

### 8. **Animation**
- [ ] Logo de chargement au démarrage
- [ ] Cards ont fade-in smooth
- [ ] Visualiser animé quand en lecture
- [ ] Toast notifications apparaissent en bas droit

### 9. **Navigation**
- [ ] "Voir tout" → pages complètes
- [ ] Cliquer artiste → devrait aller page artiste
- [ ] Cliquer album → devrait aller page album
- [ ] Cliquer playlist → devrait aller page playlist

### 10. **Performances**
- [ ] Page charge en < 2 secondes
- [ ] Images optimisées (pas de flicker)
- [ ] Aucun memory leak en scrollant
- [ ] Console sans erreurs

---

## 🎯 Étapes pour Tester

1. **Démarrer l'app :**
   ```bash
   npm run dev
   ```

2. **Aller à l'accueil :**
   ```
   http://localhost:3000/accueil
   ```

3. **Faire défiler toutes les sections**

4. **Tester chaque bouton/interaction**

5. **Ouvrir DevTools (F12)**
   - Vérifier pas d'erreurs
   - Tester responsive (Ctrl+Shift+M)

6. **Tester lecteur global :**
   - Jouer une chanson
   - Pause
   - Prochaine (si implémentée)
   - Vérifier queue (si visible)

---

## 🐛 Debugging

Si problème :

1. Vérifier console (F12)
2. Vérifier Network tab
3. Vérifier store Zustand (devtools)
4. Vérifier images chargent bien
5. Vérifier localStorage pour favoris

---

## 📱 Responsive Sizes

```
Desktop:  >= 1024px
Tablet:   768px - 1023px
Mobile:   < 768px
```

Utiliser DevTools responsive mode pour tester.

---

**Bonne chance ! 🚀**
