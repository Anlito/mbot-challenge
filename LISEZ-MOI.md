# mBot Challenge — mode d’emploi

**Version en cours de construction (jalon 4).** Espace des écuries et outil professeur prêts. À venir : régie du
jour J.

## Pour les élèves

- Adresse : https://anlito.github.io/mbot-challenge/ (Chrome ou Edge).
- « Nouvelle écurie » : les prénoms (1 à 4) et la classe, puis le dossier `… › 3X › COMMUN › TECHNOLOGIE › MBOT CHALLENGE`.
  L’outil y crée le dossier de l’écurie (`Prénom_Prénom`) et le fichier `Prénom_Prénom.json`, réenregistré tout seul.
- « Ouvrir notre écurie » : choisir le dossier de l’écurie.
- **Permis mBot** : chaque équipier clique sur « C’est moi au clavier » et fait les 8 exercices pour lui.
- **Défis** : ouverts dès qu’un équipier a son permis. « Programmer » ouvre le défi dans Labo Blocs (programme commun à
  l’écurie) ; « Carnet d’essais » chronomètre et note chaque essai sur la piste.

## Calendrier des classes

Les classes à 1 h ont 11 séances (tournoi en séances 10 et 11), les autres 10 séances (tournoi en séance 10).
Réglage actuel : 3C1, 3C2, 3D1 et 3D2 à 1 h 30, les autres à 1 h (`site/donnees/calendrier.js`).

## Labo Blocs

Le moteur de Labo Blocs et les réglages du collège (classes, chemin des dossiers) sont lus en ligne : une connexion
Internet est nécessaire.

## Réglages à faire par le professeur

- **Taille maximale d’une pièce 3D** : `site/donnees/livrables.js`, `style.dimensionsMax: [longueur, largeur, hauteur]`
  en mm (tant que c’est `null`, les dimensions sont montrées sans être contrôlées).
- **Vidéos du cours** : `OST-automatise.mp4` et `mbot.mp4` dans le dossier du serveur où se trouve le raccourci de
  l’outil. Sur chaque poste, la première fois, l’élève choisit ce dossier (« Choisir le dossier des vidéos »).
- **Photos du téléphone** : l’élève se les envoie par e-mail, puis « Ajouter un fichier » ; les visages se floutent
  avant l’enregistrement.

## Pour le professeur

- Adresse : https://anlito.github.io/mbot-challenge/prof.html (code professeur : le même que Labo Blocs).
- « Ouvrir le dossier de la classe » : choisir `… › 3X › COMMUN › TECHNOLOGIE › MBOT CHALLENGE`. Le tableau se met à
  jour tout seul ; l’encart « À regarder » montre les écuries qui ont besoin de vous.
- Fiche d’une écurie : onglet **Bilan et note** pour noter (les niveaux se gardent tout seuls), onglet **Séances**
  pour valider le point de fin avec le chef de projet.
- **Évaluations › Enregistrer dans un fichier** : choisir un fichier dans votre dossier personnel ; il est réécrit à
  chaque changement (sinon, les évaluations restent seulement dans ce navigateur).
- Exports : **Excel** (élèves et écuries), **CSV**, **Pronote** (une ligne par élève, compétences au vocabulaire de
  Pronote), **Affiches à imprimer** (dernière version de chaque affiche, pour le vote des autres classes).
