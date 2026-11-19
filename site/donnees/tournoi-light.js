// Le tournoi « light » (regie-light.html) : le professeur tape les noms des équipes, quatre épreuves en une séance.
// Mêmes règles que le grand tournoi (donnees/tournoi.js) pour l'affiche et les trois défis chronométrés, mêmes malus.
//   sorte : 'chrono' (temps + malus), 'obstacles' (temps, validé si tous les objets sont sortis à temps),
//           'votes' (affiche : nombre de votes)
definirTournoi({
  formule: 'light',
  epreuves: [
    { id: 'affiche', titre: 'Affiche · votes', sorte: 'votes', jour: 1, aide: 'Nombre de votes pour l’affiche de chaque équipe.' },
    { id: 'ligne', titre: 'Défi 1 · Suivre la ligne', sorte: 'chrono', jour: 1, malus: { libelle: 'Sortie de piste', secondes: 5 }, aide: 'Un tour. Sortie de piste : malus, on replace le mBot.' },
    { id: 'obstacles', titre: 'Défi 2 · Sortir les obstacles', sorte: 'obstacles', jour: 1, objets: 3, tempsMax: 120, malus: { libelle: 'mBot sorti de la zone', secondes: 5 }, aide: 'Les 3 objets dehors en 2 minutes ; sinon le défi n’est pas validé.' },
    { id: 'labyrinthe', titre: 'Défi 3 · Le labyrinthe', sorte: 'chrono', jour: 1, malus: { libelle: 'Contact avec un obstacle', secondes: 5 }, aide: 'Pilotage au clavier. Chaque contact avec un obstacle : malus.' },
  ],
  // Points par place (1ʳᵉ, 2ᵉ…) ; égalité : même place, mêmes points.
  points: [10, 8, 6, 5, 4, 3, 2, 1],
  // Épreuve passée sans être réussie (défi 2 non validé, abandon) : ce nombre de points.
  pointsNonReussi: 1,
});
