# mBot Challenge

Outil du projet de technologie de 3e « mBot Challenge » : les écuries (3 à 4 élèves) préparent le grand tournoi en
autonomie (programmation du mBot avec Labo Blocs, affiche, style du mBot, vidéos, rapports de séance) ; le professeur
suit et note leur travail en direct, puis anime le tournoi avec la régie du jour J.

- **Élèves** : `site/index.html` (en ligne : https://anlito.github.io/mbot-challenge/).
- **Professeur** : `site/prof.html` ; **régie du tournoi** : `site/regie.html`, qui ouvre l’**écran projeté** `site/ecran.html` (code professeur : le même que Labo Blocs) ; **fiches à imprimer** : `site/fiches.html`.

Plan de construction et décisions : [`docs/PLAN.md`](docs/PLAN.md). Recette : [`docs/RECETTE.md`](docs/RECETTE.md).
Maquette validée : https://claude.ai/artifact/HxMYDzR9oyhdrdu5gdXG1f

## État — jalon 6 (mise en service), 26 octobre 2026

- **Fiches à imprimer** : `site/fiches.html` (démarrage élève, règles du tournoi, affiche et style), construites à
  partir des données de l’outil (un malus ou un cahier des charges changé change aussi la fiche) ; lien dans
  l’outil professeur et dans la rubrique Défis.
- Archive : `npm run archive` → `dist/mbot-challenge.zip` (le site et le mode d’emploi).
- Fiche « mBot Challenge » ajoutée sur https://anlito.github.io (élèves ; professeur : outil, régie, fiches).

## Jalon 5 (régie du jour J), 26 octobre 2026

- **Préparation** : écuries lues dans le dossier de la classe (ou des `.json`), ordre de passage (tiré au sort ou
  réglé à la main), jour de chaque épreuve (classes à 1 h : jour 1 style, ligne, obstacles ; jour 2 labyrinthe,
  Récolte, affiche), matchs de la Récolte tirés au sort (chaque écurie : 2 matchs, 2 adversaires différents).
- **Épreuves chronométrées** : barre d’espace (départ, arrivée), M (malus), O (objet sorti), annuler le dernier
  appui, abandon ; défi 2 en compte à rebours de 2 min, arrêt automatique aux 3 objets ou au temps ; deux postes en
  même temps en option ; l’écurie suivante monte en piste toute seule.
- **Récolte** (90 s, scores en direct), **votes de l’affiche**, **classement du jury** (glisser ou ↑ ↓).
- **Classement** : points par place (10, 8, 6, 5, 4, 3, 2, 1 ; égalités ; non réussi = 1), classement général,
  classement de toutes les classes (fichiers des tournois des autres classes), export CSV.
- **Écran projeté** (2ᵉ fenêtre) : accueil, passage en direct avec chrono, résultats d’une épreuve, classement
  général, podium animé ; « suspense » : pas de classement général avant le dernier jour.
- Le tournoi est gardé dans le navigateur à chaque saisie (et dans un fichier si on le choisit) : il se reprend le 2ᵉ jour.
- Réglages du tournoi : `site/donnees/tournoi.js` (épreuves, malus de 5 s, temps maximal, points).

## Jalon 4 (outil professeur), 26 octobre 2026

- **Accueil** : ouvrir le dossier `MBOT CHALLENGE` de la classe (suivi en direct, relu toutes les 10 s), reprendre le
  dernier dossier, ou importer des `.json`.
- **Classe** : chiffres clés, encart « À regarder » (écurie incomplète, pas de point de départ aujourd’hui, rapport pas
  remis, blocage noté, affiche en retard, exercice raté 6 fois), tableau des écuries (séance, permis, défis, affiche,
  style, vidéos, rapports, note, activité).
- **Fiche de l’écurie** : Bilan et note (7 critères à 4 niveaux avec ce que l’outil constate sous chacun, ajustement
  individuel de −2 à +2 avec motif, commentaire, historique des rôles), Séances (« Point fait avec le chef de projet »,
  écrit aussi dans `validations.json` du dossier de l’écurie, que l’écurie voit), Rapports, Permis mBot, Défis,
  Affiche, Style (aperçu 3D), Vidéos, Comprendre.
- **Barème** (coefficients, 0 = critère retiré), **Évaluations** (gardées dans le navigateur et réécrites dans un
  fichier du professeur), exports **Excel**, **CSV**, **Pronote**, **planche des affiches** à imprimer.

## Jalon 3 (séances et livrables), 26 octobre 2026

- **Couleur de l’écurie** : 8 propositions ou n’importe quelle couleur de la palette ; toute l’interface de l’écurie
  (bandeau, onglets, boutons, liens, écran de Labo Blocs) prend un thème tiré de cette couleur, foncé ou éclairci
  automatiquement pour rester lisible (`theme()` dans `js/moteur/ecurie.js`, contrastes testés sur des couleurs extrêmes).

- **Séance** : point de départ du chef de projet (tâches, qui, temps prévu, pour quel livrable ; chacun a une tâche ;
  le reste à faire de la fois précédente est repris), point de fin (fait / pas encore, reste, bloquant), historique.
- **Rapport du reporter** : texte guidé, photos par webcam ou fichier (`rapports/seance-05-1.jpg`), visages floutés
  en mosaïque avant l’enregistrement (`js/photo-editeur.js`).
- **Affiche** : date limite selon la classe, liste de contrôle, versions déposées (`affiche/affiche-v2.png|pdf`), aperçu.
- **Style du mBot** : cahier des charges, description, plan du défilé, pièces STL (dimensions, aperçu 3D sur canvas
  `js/stl-vue.js`, contrôle si `dimensionsMax` est réglé dans `donnees/livrables.js`), photos floutées.
- **Vidéos** : storyboard (plans, image, son, durée) et dépôt de la vidéo de promotion et du reportage (`videos/`).
- **Comprendre le mBot** : vidéos chapitrées lues depuis le dossier du serveur (choisi une fois par poste), QCM de
  15 questions noté sur 20 avec correction, 7 fonctions des chaînes à expliquer.

## Jalon 2 (espace de l’écurie), 26 octobre 2026

- **Écurie** : nom (2 à 24 caractères), couleur parmi 8 (lisibles en blanc), logo rangé dans le dossier de l’écurie
  (`logo.png`), rôles (un chef de projet, un reporter, jamais la même personne ; cumul permis ; historique gardé).
- **Permis mBot** : chaque équipier fait lui-même les 8 exercices du parcours Labo Blocs « mbot-challenge » ; son travail
  est une rubrique `programmation` à son nom (`ecurie.permis[prénom]`), à côté de celle de l’écurie.
- **Défis** : ouverts dès qu’un équipier a son permis ; programmés en commun (rubrique `programmation` de l’écurie) ;
  carnet d’essais par défi avec chrono, compteur (sorties, objets, contacts, balles), résultat, réglage, hypothèse.
- Le paddock montre l’état de chaque rubrique ; séance, affiche, style, vidéos et « Comprendre le mBot » : jalon 3.

## Jalon 0 (mise en place), 26 octobre 2026

- Accueil « Nouvelle écurie » (1 à 4 prénoms, classe de 3e, dossier `… › COMMUN › TECHNOLOGIE › MBOT CHALLENGE`) ou
  « Ouvrir notre écurie » ; le dossier de l'écurie et son fichier `Prénom_Prénom.json` sont créés par l'outil, jamais
  écrasés.
- Paddock de l'écurie : bandeau, circuit des séances selon la classe (10 ou 11 séances), rubriques à venir, équipage.
- Charte « course » aux couleurs du mBot, polices copiées dans le site.
- Tests du moteur (`npm test`) : fichier de l'écurie, calendrier, données.

## Organisation

| Dossier | Contenu |
|---|---|
| `site/donnees/` | `projet.js` (identité du projet), `calendrier.js` (séances par classe), `defis.js` (mesures du carnet d’essais), `livrables.js` (textes et réglages : taille maximale des pièces 3D…), `comprendre.js` (vidéos, chapitres, QCM, chaînes), `notation.js` (critères, compétences, coefficients), `tournoi.js` (épreuves du jour J, malus, points), `college.js` (copie de secours des réglages du collège, rafraîchie à chaque publication) |
| `site/js/moteur/` | `progression.js` (fichier de l'écurie), `ecurie.js` (identité, rôles, permis, défis, essais), `livrables.js` (séances, rapports, affiche, STL, vidéos, QCM, chaînes), `classe.js` (outil professeur : lecture, alertes, notes, exports), `tournoi.js` (épreuves, points, classements), `calendrier.js` (circuit des séances), `catalogue.js` (données), `xlsx.js` (archive ZIP) |
| `site/js/` | `accueil.js`, `fichiers.js`, `session.js` (repris du modèle commun de l'atelier du distributeur), `dossier-ecurie.js`, `medias.js` (fichiers du dossier de l'écurie), `paddock.js`, `ecurie-ecran.js`, `programmation.js` (permis, défis, carnet d'essais, écran de Labo Blocs), `seance.js`, `livrables-ecran.js` (affiche, style, vidéos), `comprendre-ecran.js`, `photo-editeur.js` (webcam, flou), `stl-vue.js` (aperçu 3D), `parcours-source.js`, `icones.js`, `connexion-labo.js` |
| `site/css/` | `atelier.css` (charte), `ecurie.css` (rubriques), `livrables.css` (séance, affiche, style, vidéos, comprendre), `polices.css` |
| `tools/` | `serve.js` (`npm start`, http://localhost:8080), `exemples-equipes.js` (`npm run exemples`), `archive.js` (`npm run archive`), `polices.js`, `dependances-tests.js` |

Labo Blocs (moteur, réglages du collège, bientôt le parcours « mbot-challenge ») est chargé en ligne depuis
https://anlito.github.io/labo-blocs/ : aucune copie dans ce dépôt. Dépôt public : uniquement des données fictives.

<!-- suivi-maintenance:debut -->
### Référence locale et maintenance

Dossier de travail de référence : **Documents/MbotChallenge**. Dépôt : [Anlito/mbot-challenge](https://github.com/Anlito/mbot-challenge). La branche principale est **main**.

À chaque intervention : vérifier les modifications locales et la version publiée ; décrire dans ce README les
améliorations, les vérifications et les limites ; publier ; contrôler que le commit local et le commit distant sont
les mêmes avant d'annoncer que le projet est à jour.
<!-- suivi-maintenance:fin -->
