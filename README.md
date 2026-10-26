# mBot Challenge

Outil du projet de technologie de 3e « mBot Challenge » : les écuries (3 à 4 élèves) préparent le grand tournoi en
autonomie (programmation du mBot avec Labo Blocs, affiche, style du mBot, vidéos, rapports de séance) ; le professeur
suit et note leur travail en direct, puis anime le tournoi avec la régie du jour J.

- **Élèves** : `site/index.html` (en ligne : https://anlito.github.io/mbot-challenge/).
- **Professeur** et **régie du jour J** : jalons 4 et 5.

Plan de construction et décisions : [`docs/PLAN.md`](docs/PLAN.md). Recette : [`docs/RECETTE.md`](docs/RECETTE.md).
Maquette validée : https://claude.ai/artifact/HxMYDzR9oyhdrdu5gdXG1f

## État — jalon 0 (mise en place), 26 octobre 2026

- Accueil « Nouvelle écurie » (1 à 4 prénoms, classe de 3e, dossier `… › COMMUN › TECHNOLOGIE › MBOT CHALLENGE`) ou
  « Ouvrir notre écurie » ; le dossier de l'écurie et son fichier `Prénom_Prénom.json` sont créés par l'outil, jamais
  écrasés.
- Paddock de l'écurie : bandeau, circuit des séances selon la classe (10 ou 11 séances), rubriques à venir, équipage.
- Charte « course » aux couleurs du mBot, polices copiées dans le site.
- Tests du moteur (`npm test`) : fichier de l'écurie, calendrier, données.

## Organisation

| Dossier | Contenu |
|---|---|
| `site/donnees/` | `projet.js` (identité du projet), `calendrier.js` (séances par classe), `college.js` (copie de secours des réglages du collège, rafraîchie à chaque publication) |
| `site/js/moteur/` | `progression.js` (fichier de l'écurie), `calendrier.js` (circuit des séances), `catalogue.js` (données), `xlsx.js` (archive ZIP) |
| `site/js/` | `accueil.js`, `fichiers.js`, `session.js` (repris du modèle commun de l'atelier du distributeur), `dossier-ecurie.js`, `paddock.js`, `icones.js`, `connexion-labo.js` |
| `site/css/` | `atelier.css` (charte), `polices.css` |
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
