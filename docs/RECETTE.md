# Recette — mBot Challenge

## Jalon 0 — mise en place (26/10/2026)

Vérifié par Claude :
- `npm test` : 14 tests réussis (fichier de l'écurie, calendrier 10/11 séances, données du projet).
- Chrome, serveur local : l'accueil s'affiche sans erreur ; la liste des classes ne propose que les 3e des réglages du
  collège ; le chemin `Bureau › Classe › 3D › COMMUN › TECHNOLOGIE › 3D1 › MBOT CHALLENGE` est montré avec le dossier
  à choisir surligné ; le paddock d'une écurie fictive affiche le circuit (11 séances pour une classe à 1 h,
  affiche en 8, tournoi en 10 et 11) ; pas de défilement horizontal en largeur téléphone (375 px).

À vérifier par Thomas :
1. Ouvrir https://anlito.github.io/mbot-challenge/ dans Chrome ou Edge (après publication).
2. « Nouvelle écurie » : 2 prénoms, une classe de 3e, Suivant.
3. « Choisir le dossier » : sélectionner un dossier d'essai nommé `MBOT CHALLENGE` → l'outil crée `Prénom_Prénom`
   et son fichier `.json`, puis « Commencer » ouvre le paddock.
4. Fermer l'onglet, rouvrir : « Reprendre le travail de … » ramène au paddock.
5. Refaire « Nouvelle écurie » avec les mêmes prénoms dans le même dossier : l'outil propose d'ouvrir la sauvegarde
   existante, rien n'est écrasé.
6. Vérifier le circuit : 11 séances pour 3B, 3E, 3G ; 10 séances pour 3C1, 3C2, 3D1, 3D2.
