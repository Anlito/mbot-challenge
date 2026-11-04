// Identité du projet : le seul fichier à changer pour un autre projet sur le même modèle.
//   id          : nom de l'application dans les sauvegardes et préfixe des clés du navigateur
//   dossier     : dossier du projet dans le dossier de la classe (les élèves le choisissent, l'outil y crée l'écurie)
//   niveaux     : les classes proposées à l'accueil sont celles de ces niveaux (« 3 » → 3B, 3D1…)
//   parcours    : identifiant du parcours d'exercices de Labo Blocs (jalon 1)
//   maxEleves   : nombre de prénoms proposés pour une écurie
//   raccourci   : où les élèves trouvent le raccourci de l'outil (et les vidéos du cours) sur le réseau du collège ;
//                 {classe} s'affiche « 3X » (fiche de démarrage, présentation, dossier des vidéos)
definirProjetAtelier({
  id: 'mbot-challenge',
  titre: 'mBot Challenge',
  sousTitre: 'Prépare ton écurie pour le grand tournoi : programmation, affiche, style du mBot, vidéos.',
  dossier: 'MBOT CHALLENGE',
  niveaux: ['3'],
  parcours: 'mbot-challenge',
  accent: '#1565C0',
  maxEleves: 4,
  raccourci: ['Classe', '{classe}', 'MATIERES', 'TECHNOLOGIE', 'TABLEAU', 'MBOT CHALLENGE'],
});
