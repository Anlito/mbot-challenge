// Notation de l'écurie : note de groupe sur 7 critères à 4 niveaux, puis ajustement individuel motivé (comportement,
// investissement). Le classement du tournoi ne compte pas. Coefficients modifiables par le professeur (« Barème » de
// l'outil professeur ; ils sont gardés avec ses évaluations).
// Compétences du programme de technologie cycle 4 (BO n° 9 du 29/02/2024), reprises de la grille du projet.
definirNotation({
  niveaux: [
    { valeur: 1, nom: 'Non atteint', court: 'Non atteint' },
    { valeur: 2, nom: 'Partiellement atteint', court: 'Partiel' },
    { valeur: 3, nom: 'Atteint', court: 'Atteint' },
    { valeur: 4, nom: 'Dépassé', court: 'Dépassé' },
  ],
  criteres: [
    { id: 'programme', nom: 'Algorithme et programme', coefficient: 1,
      competence: 'Concevoir, écrire, tester et mettre au point un programme',
      pronote: 'Élaborer un algorithme puis le traduire en un programme structuré, le tester et le mettre au point' },
    { id: 'tests', nom: 'Tests, réglages et dépannage', coefficient: 1,
      competence: 'Valider les solutions techniques par des protocoles de tests ; identifier un dysfonctionnement et y remédier',
      pronote: 'Proposer un protocole de test pour valider le comportement et les performances d’un objet technique' },
    { id: 'chaines', nom: 'Chaînes d’information et d’énergie', coefficient: 1,
      competence: 'Décrire et caractériser l’organisation interne d’un objet technique et ses échanges avec son environnement',
      pronote: 'Décrire et caractériser l’organisation interne d’un OST (chaînes d’information et d’énergie)' },
    { id: 'affiche', nom: 'Affiche de l’écurie', coefficient: 1,
      competence: 'Imaginer, concevoir et réaliser une solution dans une démarche de créativité',
      pronote: 'Imaginer des solutions pour répondre à un besoin et les communiquer' },
    { id: 'style', nom: 'Style du mBot', coefficient: 1,
      competence: 'Imaginer, concevoir et réaliser une solution (modélisation 3D, fabrication) dans une démarche de créativité',
      pronote: 'Concevoir et réaliser une solution, la modéliser en 3D' },
    { id: 'videos', nom: 'Vidéos (promotion, reportage)', coefficient: 1,
      competence: 'Communiquer sur un projet à l’aide d’outils numériques',
      pronote: 'Rendre compte d’un projet avec des outils numériques' },
    { id: 'projet', nom: 'Gestion de projet', coefficient: 1,
      competence: 'Élaborer un processus de conception et de réalisation dans une durée, avec des tâches identifiées',
      pronote: 'Organiser un projet en équipe : planifier, répartir les tâches, rendre compte' },
  ],
  // Ajustement individuel : de −ajustementMax à +ajustementMax points, avec un motif.
  ajustementMax: 2,
});
