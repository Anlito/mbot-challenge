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

## Jalon 2 — espace de l'écurie (26/10/2026)

Vérifié par Claude :
- `npm test` : 22 tests (identité, couleurs lisibles en blanc, rôles et historique, parcours coupé en 8 exercices +
  5 défis, permis propre à chaque équipier et relu depuis le fichier, défis ouverts dès un permis fini, carnet
  d'essais, meilleur temps, défilé au plus près de 30 s).
- Chrome, serveur local, écurie fictive : nom et couleur enregistrés (bandeau mis à jour), refus en ambre « Inès ne
  peut pas être à la fois chef de projet et reporter », rôles enregistrés ; « C'est moi au clavier » ouvre l'écran de
  Labo Blocs (« Permis de Inès ») ; « J'ai terminé » sur l'exercice 1 → Inès 1/8, les autres 0/8, rien dans les défis
  de l'écurie ; avec un permis fini, les 5 défis s'ouvrent ; le défi 4 s'ouvre avec Simulateur et En direct seulement ;
  chrono 2,0 s recopié dans l'essai, essai noté dans le tableau ; largeur téléphone sans défilement horizontal.

Pas vérifié par Claude (fenêtres de Windows) : l'enregistrement du logo dans le dossier de l'écurie.

À vérifier par Thomas :
1. Créer une écurie d'essai, puis rubrique **Écurie** : nom, couleur, logo (une image PNG) → `logo.png` apparaît dans
   le dossier de l'écurie et le logo s'affiche dans le bandeau. Fermer l'onglet et rouvrir : le logo revient (le
   navigateur peut redemander l'autorisation).
2. Rôles : essayer un chef qui est aussi reporter (refusé), puis une répartition correcte.
3. **Programmation** : deux équipiers font chacun l'exercice 1 ; chacun retrouve ses propres blocs.
4. Avec un mBot : un équipier finit son permis (8 exercices) → l'onglet **Défis** s'ouvre ; programmer le défi 1 et
   l'envoyer dans le robot.
5. **Carnet d'essais** : chronométrer un tour, noter l'essai, vérifier le meilleur temps sur la carte du défi.

## Jalon 3 — séances et livrables (26/10/2026)

Vérifié par Claude :
- `npm test` : 29 tests (points de départ et de fin, reprise du reste à faire, rapport, versions de l'affiche,
  dimensions STL binaire et texte, contrôle des dimensions avec pièce tournée, storyboard, QCM noté au demi-point,
  7 fonctions).
- Chrome, écurie fictive : point de départ (chacun a une tâche), point de fin refusé tant qu'une tâche n'est pas
  cochée ou que le reste à faire manque, historique ; outil photo : zone glissée sur un texte → mosaïque, JPEG rendu ;
  affiche : « à rendre à la prochaine séance » en séance 7 ; aperçu 3D d'un STL qui tourne à la souris ; storyboard
  enregistré (durée totale) ; vidéos : invitation à choisir le dossier ; QCM : question manquante signalée, 12/15 →
  16/20 avec correction ; largeur téléphone sans défilement horizontal.

Pas vérifié par Claude (fenêtres de Windows, webcam) : l'écriture des photos, de l'affiche, des STL et des vidéos
dans le dossier de l'écurie ; la webcam ; la lecture des vidéos depuis le dossier du serveur.

À vérifier par Thomas :
1. **Séance** : point de départ, puis point de fin, puis rapport avec une photo **webcam** et une photo **fichier**,
   en floutant un visage → les JPG sont dans `rapports/` et la mosaïque cache bien le visage.
2. **Affiche** : déposer un PNG puis un PDF exporté de Canva → `affiche/affiche-v1.png`, `affiche-v2.pdf`, aperçu.
3. **Style** : déposer un STL de Tinkercad → dimensions justes, aperçu 3D. Me donner la taille maximale d'une pièce
   pour l'imprimante (je la règle dans `donnees/livrables.js`).
4. **Vidéos** : déposer une vidéo de téléphone (MP4) → `videos/promo.mp4`, lecture dans l'outil.
5. **Comprendre** : choisir le dossier du serveur qui contient `OST-automatise.mp4` et `mbot.mp4` → lecture et
   chapitres ; QCM ; les 7 fonctions.

### Retours de Thomas sur le jalon 3 (26/10/2026)

- Storyboard des vidéos : colonnes mal réparties → corrigé (plan étroit, deux colonnes de texte égales, durée courte).
- Couleur de l'écurie : palette libre en plus des 8 propositions ; l'interface de l'écurie prend la couleur choisie.
  Vérifié : jaune vif #FFE600 → bandeau et boutons en tons foncés, pastille jaune avec lettre sombre ; tests de
  contraste sur blanc, noir, vert, rouge, jaune, cyan, rose, gris (boutons ≥ 4,5:1, bandeau ≥ 12:1, onglets ≥ 7:1,
  repères jaunes lisibles, pastille ≥ 4,5:1).

## Retour de Thomas : séance (26/10/2026)

- La séance mélangeait le travail du chef de projet et celui du reporter → frise des 5 étapes (qui agit à chacune,
  étape en cours), zone bleue « Côté chef de projet · À remplir par … » (point de départ, point de fin), zone violette
  « Côté reporter · À remplir par … » (rapport). Historique : colonne « Point avec le professeur ».

## Jalon 4 — outil professeur (26/10/2026)

Vérifié par Claude :
- `npm test` : 35 tests (lecture des écuries et copie la plus récente, résumé, alertes dont « exercice raté 6 fois »,
  notes avec coefficients et ajustement borné, CSV, Pronote, fichier Excel, scripts de prof.html présents).
- Chrome, 7 écuries fictives importées : tableau de la classe, chiffres clés, « À regarder » ; fiche Foudre : niveaux
  Atteint + Dépassé → 17,5/20, ajustement +1 avec motif → Inès 18,5 ; les 9 onglets s'affichent ; « Point fait avec
  le chef de projet » noté ; évaluations gardées dans le navigateur ; planche des 7 affiches.

Pas vérifié par Claude : suivi en direct d'un vrai dossier de classe, écriture de `validations.json` dans le dossier
d'une écurie, fichier d'évaluations, téléchargement des exports, impression de la planche.

À vérifier par Thomas :
1. Ouvrir `prof.html`, taper le code professeur, ouvrir le dossier `MBOT CHALLENGE` d'une classe d'essai.
2. Pendant qu'un poste élève travaille, le tableau se met à jour (« En direct · lu à … »).
3. Noter une écurie, enregistrer les évaluations dans un fichier, fermer, rouvrir : tout est là.
4. « Point fait avec le chef de projet » → côté élève, l'historique des séances affiche « ✓ fait ».
5. Exports Excel, CSV, Pronote ; planche des affiches (aperçu avant impression).
6. Me dire si les coefficients (tous à 1) et l'ajustement (−2 à +2) te conviennent.
