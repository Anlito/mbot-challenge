# mBot Challenge — plan de construction

Version 1 · 26 octobre 2026 · **à valider par Thomas avant d'écrire le code**.

Outil du projet de technologie de 3e « mBot Challenge » : les écuries (3 à 4 élèves) se préparent au tournoi en
autonomie, mettent tout leur travail en commun dans l'outil, et le professeur suit, note et anime le jour J.

Maquette validée : https://claude.ai/artifact/HxMYDzR9oyhdrdu5gdXG1f (6 écrans : paddock, séance, classe, fiche de
l'écurie, console de régie, écran projeté).

---

## 1. Ce qui est décidé

| Sujet | Décision |
|---|---|
| Programmation | **Labo Blocs**, mBot v1, ports imposés par Labo Blocs, clé 2.4G (testée par Thomas) |
| Écuries | 4 à 8 par classe, 3 à 4 élèves, au moins 2 ordinateurs par écurie (15 postes par salle) |
| Calendrier | Classes à 1 h : **11 séances**, affiche à rendre en séance 8, tournoi en séances 10 et 11. Classes à 1 h 30 : 10 séances, affiche en séance 8, tournoi en séance 10 (découpable en deux) |
| Rôles | Chef de projet, reporter, programmeur, designer, ingénieur d'essais, pilote. Cumul possible, changement possible en cours de projet, **chef de projet ≠ reporter** |
| Livrables | Exercices (« permis mBot »), 5 défis, affiche Canva, style du mBot (STL, carton, photos), défilé de 30 s, vidéo de promotion, reportage vidéo, rapports de séance, chaînes d'information et d'énergie |
| Défi 1 · Ligne | **1 tour**, chrono ; sortie de piste = malus, on replace |
| Défi 2 · Obstacles | 3 objets à sortir de la zone en 2 min max ; validé seulement si les 3 sont sortis ; classement au temps ; robot qui sort = malus |
| Défi 3 · Labyrinthe | Pilotage au clavier ; 4 obstacles fixes, malus à chaque contact ; rien de plus |
| Défi 4 · Récolte | Duel 1 contre 1, 90 s : outil de ramassage conçu par l'écurie, pilotage clavier, **sécurité automatique** par le capteur de ligne (le robot ne franchit pas la bordure). 2 matchs par écurie, adversaires tirés au sort, classement aux victoires puis aux balles |
| Style et défilé | Robot habillé (éléments posés et retirés facilement), défilé programmé de 30 s, jury qui classe du 1er au dernier |
| Affiche | Votes des autres classes saisis par le professeur |
| Barème du tournoi | 10 · 8 · 6 · 5 · 4 · 3 · 2 · 1 par épreuve, 6 épreuves égales ; égalité = même place, mêmes points ; défi 2 non validé = 1 pt ; classement par classe, puis toutes classes (points ramenés sur 10 si les classes n'ont pas le même nombre d'écuries) |
| Note | Note de groupe sur 7 critères à 4 niveaux (algorithme et programme, tests et réglages, chaînes, affiche, style, vidéos, gestion de projet) + **ajustement individuel motivé** (comportement, investissement). **Le classement ne compte pas dans la note** |
| Photos du téléphone | L'élève s'envoie le fichier par e-mail, puis « Ajouter un fichier ». Pas de serveur relais |
| Dossiers | `… › 3X › COMMUN › TECHNOLOGIE › MBOT CHALLENGE › Prénom_Prénom` (règle commune), médias dans des sous-dossiers |
| Vidéos du cours | Dans le dossier du serveur où se trouve le raccourci de l'outil |
| Design | Ambiance course aux couleurs du mBot (bleu mBot, bleu nuit, jaune drapeau, damier le jour J), écarts en ambre |

## 2. Organisation technique

Modèle commun le plus récent : **Théâtre d'ombre** (`Documents/TheatreDombre`, prof.html commun, notation à 4 niveaux,
STL, photos, Pronote) et l'**atelier du distributeur** (`atelier-cereales`, brief `BRIEF-NOUVEAU-PROJET.md`), plus la
**régie d'Escape Lab** pour le jour J.

- Dépôt **`Anlito/mbot-challenge`**, dossier de référence **`Documents/MbotChallenge`**, publié sur GitHub Pages
  (`https://anlito.github.io/mbot-challenge/`).
- **Labo Blocs chargé en ligne** comme le Théâtre et le Labyrinthe (`anlito.github.io/labo-blocs/module/…` et
  `parcours/mbot-challenge/parcours.js`) : aucune copie dans le dépôt ; le parcours se modifie dans l'éditeur de Labo
  Blocs.
- Site statique, aucun compte, rien d'envoyé ailleurs (seule lecture : réglages du collège et Labo Blocs en ligne).
  Fonctionne en `file://` ou en ligne, avec Chrome ou Edge (écriture dans les dossiers de classe).
- Identité du projet dans un seul fichier : `site/donnees/projet.js` (`definirProjetAtelier({ id: 'mbot-challenge',
  titre, dossier: 'MBOT CHALLENGE', niveaux: ['3'], accent })`).
- Réglages par classe (`site/donnees/calendrier.js` + choix du professeur) : nombre de séances (10 ou 11), séance
  limite de l'affiche, séances du tournoi.

### Pages

| Page | Pour qui | Contenu |
|---|---|---|
| `site/index.html` | élèves | accueil, écurie, paddock, séance, programmation, défis, affiche, style, vidéos, comprendre le mBot, rapports |
| `site/prof.html` | professeur | classe en direct, fiche de l'écurie, notation, exports |
| `site/regie.html` | professeur | console du jour J (préparation, épreuves, chronos, saisies) |
| `site/ecran.html` | vidéoprojecteur | ouverte par la régie dans une 2ᵉ fenêtre : épreuve en cours, classements, podium |

### Fichiers

- **Fichier de l'équipe** `Prénom_Prénom.json` : rubrique `programmation` (Labo Blocs, jamais touchée par le projet) et
  rubrique `ecurie` (identité, rôles et historique des rôles, séances, rapports, carnet d'essais, livrables, QCM,
  chaînes). Versionné, jamais écrasé, anciennes versions lisibles.
- **Médias** dans le dossier de l'équipe : `affiche/`, `style/` (STL, photos), `rapports/`, `videos/`. Le fichier de
  l'équipe ne garde que leur nom et leur date.
- **Évaluations** du professeur : `mbot-challenge-evaluations-3B.json` dans son dossier personnel (comme le Théâtre) ;
  les points de fin validés sont écrits dans `validations.json` du dossier de l'équipe.
- **Tournoi** : `mbot-challenge-tournoi-3B.json` dans le dossier du professeur, enregistré à chaque saisie ; il se
  reprend le 2ᵉ jour. Le classement toutes classes importe les fichiers de tournoi des autres classes.

---

## 3. Jalons

Chaque jalon se termine par des tests `node:test`, une recette écrite dans `docs/RECETTE.md` et **un arrêt pour la
recette avec Thomas** avant le suivant.

### Jalon 0 — Mise en place
- Créer le dépôt et le dossier, reprendre les fichiers communs du Théâtre et du distributeur (session, dossier
  d'équipe, accueil, moteur de classe, exports, icônes, charte), changer l'identité du projet.
- Charte « course » : couleurs, polices locales, composants de la maquette (bandeau, cartes de livrables, pastilles
  d'écurie, circuit des séances).
- Tests et publication GitHub Pages en place, données de démonstration fictives (`npm run exemples`).
- **Recette** : l'accueil s'ouvre en ligne et en `file://`, une écurie se crée dans un dossier d'essai.

### Jalon 1 — Parcours Labo Blocs « mBot Challenge » (dans le dépôt labo-blocs)
- Les **8 exercices** de ton document mBlock refaits dans l'éditeur : couleur LED, LED clignotante, son et bouton,
  bouton et LED, capteur de ligne et LED, capteur de ligne et moteurs, obstacle et moteurs (1 et 2). Indices sans
  donner la réponse, comme tes exercices actuels.
- Les **5 défis** en exercices libres : suivre la ligne, sortir les obstacles, labyrinthe au clavier, Récolte (clavier
  + sécurité ligne), défilé de 30 s.
- **Point à essayer avec le vrai robot** : en mode « En direct » par la clé 2.4G, le robot réagit-il assez vite à la
  bordure noire pendant le pilotage au clavier ? Sinon on ajuste la règle de la Récolte avec toi.
- **Recette** : chaque exercice dans le simulateur et sur un mBot.

### Jalon 2 — Espace de l'écurie : le cœur
- Création de l'écurie : nom, logo (image), couleur, équipiers, rôles (règle chef ≠ reporter, historique des
  changements).
- **Paddock** : briefing du chef, circuit des séances selon la classe, cartes des livrables, équipage.
- **Programmation** : parcours dans l'écran de Labo Blocs ; **permis mBot** : on choisit qui est au clavier, chaque
  élève valide ses propres exercices.
- **Défis** : programme de chaque défi + **carnet d'essais** (chrono d'entraînement intégré, réglage testé, résultat,
  hypothèse quand ça ne marche pas).
- **Recette** : une écurie fait 2 exercices et un essai chronométré, le fichier se relit.

### Jalon 3 — Séances, rapports et livrables
- **Séance** : point de départ (tâches, qui, temps prévu, reprise du « reste à faire »), point de fin (fait / reste /
  bloquant).
- **Rapport du reporter** : texte guidé, photos par **webcam** ou **Ajouter un fichier**, **outil de flou** des visages
  intégré (rectangles à flouter avant l'enregistrement).
- **Affiche** : dépôt des versions (PNG, JPG, PDF), rappel de la date limite, liste de contrôle (nom, logo, prénoms).
- **Style du mBot** : cahier des charges (fixation sans outil, capteurs dégagés, dimensions max d'impression à me
  donner), dépôt STL avec **aperçu 3D et contrôle des dimensions** (repris du Théâtre), photos, plan du défilé.
- **Vidéos** : storyboard (cases à remplir), dépôt de la vidéo de promotion et du reportage.
- **Comprendre le mBot** : tes vidéos chapitrées (lues depuis le dossier du serveur), le QCM (score enregistré),
  l'annexe des 7 cases des chaînes.
- **Recette** : une séance complète jouée de bout en bout avec photos floutées.

### Jalon 4 — Outil professeur
- **Classe en direct** : chiffres clés, encart « À regarder » (écurie bloquée, pas de point de départ, rapport
  manquant, affiche en retard), tableau des écuries.
- **Fiche de l'écurie** : onglets Bilan, Séances, Rapports, Programmation, Défis, Affiche, Style, Vidéos ; validation du
  point de fin en un clic.
- **Note** : 7 critères à 4 niveaux avec indices sous chaque critère, ajustement individuel motivé, coefficients dans
  « Barème ».
- **Exports** : Excel, CSV, Pronote (compétences du programme reprises de ta grille), fichier pour le Carnet de classe
  de Labo Blocs, **planche des affiches à imprimer**.
- **Recette** : 7 écuries fictives suivies en direct, une notation complète exportée.

### Jalon 5 — Régie du jour J et écran projeté
- **Préparation** : écuries de la classe, ordre de passage, tirage des matchs de la Récolte, jour 1 / jour 2.
- **Console** : chrono à la barre d'espace (départ, arrivée), malus et bonus en direct, annulation du dernier appui ;
  défi 2 avec compte à rebours de 2 min et validation des 3 objets ; labyrinthe avec compteur de contacts ; Récolte
  avec score des deux robots et chrono de 90 s ; saisie des votes de l'affiche ; classement du jury par glisser.
  Option **deux postes en même temps** (deux chronos) pour gagner du temps.
- **Écran projeté** (2ᵉ fenêtre) : passage en cours en grand, résultats de l'épreuve, suspense le jour 1, classement
  général et **podium animé** à la fin.
- Calcul des points, égalités, classement toutes classes, export des résultats.
- **Recette** : un tournoi fictif complet sur deux jours avec reprise.

### Jalon 6 — Finitions et mise en service
- Fiche de démarrage élève (1 page), mode d'emploi professeur (`LISEZ-MOI.md`), fiches imprimables des règles des
  défis et du cahier des charges du style.
- Recette complète dans Chrome et Edge, en ligne et depuis le réseau du collège, archive ZIP.
- Ajout de la fiche sur https://anlito.github.io (section du projet, encart professeur), README à jour.

---

## 4. Points à me donner en cours de route

1. Jalon 1 : les **dimensions du circuit et de l'arène de la Récolte** (taille des balles, du panier), pour les
   fiches et le simulateur.
2. Jalon 3 : le **volume d'impression maximal** et le temps d'impression accepté par écurie ; où sont rangées les
   vidéos sur le serveur (nom du dossier).
3. Jalon 4 : les **coefficients des 7 critères** (sinon tous égaux) et l'amplitude de l'ajustement individuel
   (proposition : −2 à +2).
4. Jalon 5 : qui manipule la régie (toi seul, ou un élève au chrono pendant que tu arbitres ?).
