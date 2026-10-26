# mBot Challenge

Outil du projet de technologie de 3e « mBot Challenge » : les écuries (3 à 4 élèves) préparent le grand tournoi en
autonomie (programmation du mBot avec Labo Blocs, affiche, style du mBot, vidéos, rapports de séance) ; le professeur
suit et note leur travail en direct, puis anime le tournoi avec la régie du jour J.

- **Élèves** : `site/index.html` (en ligne : https://anlito.github.io/mbot-challenge/).
- **Professeur** et **régie du jour J** : jalons 4 et 5.

Plan de construction et décisions : [`docs/PLAN.md`](docs/PLAN.md). Recette : [`docs/RECETTE.md`](docs/RECETTE.md).
Maquette validée : https://claude.ai/artifact/HxMYDzR9oyhdrdu5gdXG1f

## État — jalon 3 (séances et livrables), 26 octobre 2026

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
| `site/donnees/` | `projet.js` (identité du projet), `calendrier.js` (séances par classe), `defis.js` (mesures du carnet d’essais), `livrables.js` (textes et réglages : taille maximale des pièces 3D…), `comprendre.js` (vidéos, chapitres, QCM, chaînes), `college.js` (copie de secours des réglages du collège, rafraîchie à chaque publication) |
| `site/js/moteur/` | `progression.js` (fichier de l'écurie), `ecurie.js` (identité, rôles, permis, défis, essais), `livrables.js` (séances, rapports, affiche, STL, vidéos, QCM, chaînes), `calendrier.js` (circuit des séances), `catalogue.js` (données), `xlsx.js` (archive ZIP) |
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
