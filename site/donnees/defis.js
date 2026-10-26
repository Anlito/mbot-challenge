// Les défis du tournoi, côté écurie : ce que mesure le carnet d'essais pour chacun.
//   id        : exercice du parcours Labo Blocs « mbot-challenge » (programme du défi)
//   mesure    : ce que donne le chrono (« temps » à battre, « duree » à viser)
//   compteur  : ce qu'on compte pendant l'essai (malus ou score), null si rien
//   objectif  : rappel de la règle du tournoi
definirDefis([
  {
    id: 'mbc-d1', numero: 'D1', titre: 'Suivre la ligne', mesure: 'temps',
    compteur: { libelle: 'Sorties de piste', sorte: 'malus' },
    objectif: 'Un tour du circuit, le plus vite possible. Sortie de piste : malus, on replace le mBot.',
  },
  {
    id: 'mbc-d2', numero: 'D2', titre: 'Sortir les obstacles', mesure: 'temps',
    compteur: { libelle: 'Objets sortis (sur 3)', sorte: 'score', max: 3 },
    objectif: 'Les 3 objets hors de la zone en moins de 2 minutes, sans que le mBot en sorte.',
  },
  {
    id: 'mbc-d3', numero: 'D3', titre: 'Le labyrinthe au clavier', mesure: 'temps',
    compteur: { libelle: 'Contacts avec un obstacle', sorte: 'malus' },
    objectif: 'Sortir du labyrinthe le plus vite possible. Chaque contact avec un des 4 obstacles : malus.',
  },
  {
    id: 'mbc-d4', numero: 'D4', titre: 'La Récolte', mesure: 'temps',
    compteur: { libelle: 'Balles dans le panier', sorte: 'score' },
    objectif: 'Duel de 90 secondes : un maximum de balles dans le panier, sans franchir la bordure noire.',
  },
  {
    id: 'mbc-d5', numero: 'D5', titre: 'Le défilé', mesure: 'duree',
    compteur: null,
    objectif: 'Un spectacle d’environ 30 secondes devant le jury : déplacements, lumières, musique.',
  },
]);
