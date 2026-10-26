// Calendrier du projet : le « circuit des séances » affiché aux écuries.
// Deux modèles, selon la durée des séances de la classe :
//   une-heure        : 11 séances, affiche à rendre en séance 8, tournoi sur deux séances (10 et 11)
//   heure-et-demie   : 10 séances, affiche à rendre en séance 8, tournoi en séance 10
// classes : les classes qui n'ont pas le modèle par défaut. Un groupe (3D1, 3D2) prend le réglage de sa classe (3D)
// s'il n'a pas le sien. Réglages de Thomas (26/10/2026) : 3C1, 3C2, 3D1 et 3D2 (dont le groupe 3C2D1) à 1 h 30,
// les autres classes à 1 h.
definirCalendrier({
  defaut: 'une-heure',
  classes: {
    '3C': 'heure-et-demie',
    '3D': 'heure-et-demie',
  },
  modeles: {
    'heure-et-demie': {
      libelle: 'Séances de 1 h 30',
      seances: 10,
      affiche: 8,
      tournoi: [10],
      etapes: [
        { de: 1, a: 1, titre: 'Lancement', objectif: 'Écurie créée, rôles attribués' },
        { de: 2, a: 3, titre: 'Prise en main', objectif: 'Exercices LED et bouton faits' },
        { de: 4, a: 4, titre: 'Capteurs', objectif: 'Exercices ligne et obstacle faits' },
        { de: 5, a: 7, titre: 'Défis', objectif: 'Les programmes des défis avancent' },
        { de: 8, a: 8, titre: 'Réglages et affiche', objectif: 'Affiche rendue, défis qui marchent' },
        { de: 9, a: 9, titre: 'Réglages', objectif: 'Entraînement chronométré' },
        { de: 10, a: 10, titre: 'Tournoi', objectif: 'Le grand jour' },
      ],
    },
    'une-heure': {
      libelle: 'Séances de 1 h',
      seances: 11,
      affiche: 8,
      tournoi: [10, 11],
      etapes: [
        { de: 1, a: 1, titre: 'Lancement', objectif: 'Écurie créée, rôles attribués' },
        { de: 2, a: 3, titre: 'Prise en main', objectif: 'Exercices LED et bouton faits' },
        { de: 4, a: 4, titre: 'Capteurs', objectif: 'Exercices ligne et obstacle faits' },
        { de: 5, a: 7, titre: 'Défis', objectif: 'Les programmes des défis avancent' },
        { de: 8, a: 8, titre: 'Réglages et affiche', objectif: 'Affiche rendue, défis qui marchent' },
        { de: 9, a: 9, titre: 'Réglages', objectif: 'Entraînement chronométré' },
        { de: 10, a: 10, titre: 'Tournoi · jour 1', objectif: 'Style et défilé, ligne, obstacles' },
        { de: 11, a: 11, titre: 'Tournoi · jour 2', objectif: 'Labyrinthe, Récolte, podium' },
      ],
    },
  },
});
