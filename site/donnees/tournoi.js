// Le tournoi du jour J : épreuves, malus, points par place. Modifiable par le professeur.
//   sorte : 'chrono' (temps + malus), 'obstacles' (temps, validé si tous les objets sont sortis à temps),
//           'duel' (Récolte : matchs à deux), 'votes' (affiche), 'jury' (style et défilé : classement du jury)
//   malus : ce qu'on compte pendant le passage et les secondes ajoutées pour chacun
//   jour  : séance du tournoi quand il dure deux séances (classes à 1 h)
definirTournoi({
  epreuves: [
    { id: 'style', titre: 'Style et défilé', sorte: 'jury', jour: 1, aide: 'Le jury classe les mBot du plus stylé au moins stylé, après le défilé de 30 s.' },
    { id: 'ligne', titre: 'Défi 1 · Suivre la ligne', sorte: 'chrono', jour: 1, malus: { libelle: 'Sortie de piste', secondes: 5 }, aide: 'Un tour. Sortie de piste : malus, on replace le mBot.' },
    { id: 'obstacles', titre: 'Défi 2 · Sortir les obstacles', sorte: 'obstacles', jour: 1, objets: 3, tempsMax: 120, malus: { libelle: 'mBot sorti de la zone', secondes: 5 }, aide: 'Les 3 objets dehors en 2 minutes ; sinon le défi n’est pas validé.' },
    { id: 'labyrinthe', titre: 'Défi 3 · Le labyrinthe', sorte: 'chrono', jour: 2, malus: { libelle: 'Contact avec un obstacle', secondes: 5 }, aide: 'Pilotage au clavier. Chaque contact avec un obstacle : malus.' },
    { id: 'recolte', titre: 'Défi 4 · La Récolte', sorte: 'duel', jour: 2, dureeMatch: 90, matchsParEcurie: 2, aide: 'Duels de 90 s, 2 matchs par écurie : classement aux victoires, puis aux balles.' },
    { id: 'affiche', titre: 'Affiche · votes', sorte: 'votes', jour: 2, aide: 'Nombre de votes des autres classes pour l’affiche de chaque écurie.' },
  ],
  // Points par place (1ʳᵉ, 2ᵉ…) ; égalité : même place, mêmes points.
  points: [10, 8, 6, 5, 4, 3, 2, 1],
  // Épreuve passée sans être réussie (défi 2 non validé, abandon) : ce nombre de points.
  pointsNonReussi: 1,
});
