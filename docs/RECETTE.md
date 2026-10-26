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

## Jalon 1 — parcours Labo Blocs « mBot Challenge » (26/10/2026)

Branche `claude/parcours-mbot-challenge` du dépôt `Anlito/labo-blocs` (à fusionner pour la mise en ligne).

Vérifié par Claude :
- Parcours publiable (`controlerPublication`) : chaque solution passe ses scénarios dans le simulateur.
- Test `tests/mbot-challenge-parcours.test.js` : programmes faux refusés avec un seul écart décrit (couleurs
  inversées, côté droit oublié, « ou » au lieu de « et », seuil de 20 cm, arrêt au lieu du virage, note sans appui) ;
  les 5 défis s'ouvrent tous ensemble dès l'exercice 8 réussi ; défis 3 et 4 en direct seulement.
- Suite complète de Labo Blocs : un seul échec, qui existait déjà avant (version du programme des cartes).

À vérifier par Thomas, avec un vrai mBot, sur https://anlito.github.io/labo-blocs/site/index.html?parcours=mbot-challenge
(après la fusion) :
1. Exercices 1 et 2 (libres) : couleurs et clignotement sur le robot, « J’ai terminé ».
2. Exercice 3 : une note à chaque appui sur le bouton de la carte.
3. Exercices 5 et 6 : le suiveur de ligne sur une ligne noire (LED, puis moteurs).
4. Exercice 7 : arrêt à moins de 5 cm. **À regarder** : les ultrasons sont-ils fiables aussi près ? Sinon, passer à
   8 ou 10 cm.
5. Exercice 8 : virage à gauche devant l'obstacle (la durée de 0,3 s se règle sur le robot).
6. Défi 4 (Récolte) en direct par la clé 2.4G : le mBot recule-t-il assez vite quand il voit la bordure noire
   pendant qu'on pilote ? Si la réaction est trop lente, on adapte la règle.
7. Défi 5 : un défilé lancé par le bouton de la carte, envoyé dans le robot.
