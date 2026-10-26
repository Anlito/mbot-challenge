// Livrables de l'écurie : séances, affiche, style du mBot, vidéos. Textes affichés aux élèves et réglages.
definirLivrables({
  seance: {
    // Questions qui guident le rapport du reporter.
    aideRapport: ['Qui a fait quoi ?', 'Qu’est-ce qui a marché ?', 'Qu’est-ce qui bloque encore ?', 'Et la prochaine fois ?'],
    // Ce à quoi une tâche peut se rattacher (le professeur voit l'équilibre du travail).
    livrables: ['Permis mBot', 'Défis', 'Affiche', 'Style du mBot', 'Vidéos', 'Comprendre le mBot', 'Rapport', 'Autre'],
    photosMax: 6,
  },
  affiche: {
    formats: ['png', 'jpg', 'jpeg', 'pdf'],
    // Format attendu : A3 en portrait (297 × 420 mm). Image : au moins cette largeur en pixels pour une impression nette.
    format: { nom: 'A3 portrait (297 × 420 mm)', largeurMm: 297, hauteurMm: 420, largeurMinPx: 1240 },
    controle: [
      'Le nom de l’écurie se lit de loin',
      'Le logo de l’écurie',
      'Le prénom de chaque équipier',
      'Les couleurs de l’écurie',
      'Le mBot de l’écurie (photo ou dessin)',
      'Un slogan ou une phrase qui donne envie de voter pour nous',
    ],
  },
  style: {
    // Dimensions maximales d'une pièce imprimée en 3D, en mm [longueur, largeur, hauteur] : à régler par le
    // professeur selon son imprimante. null : les dimensions sont montrées sans être contrôlées.
    dimensionsMax: null,
    cahierDesCharges: [
      'Chaque élément se pose et s’enlève à la main, sans outil, en moins d’une minute',
      'Rien ne cache le capteur à ultrasons (à l’avant)',
      'Rien ne cache le suiveur de ligne (dessous, à l’avant)',
      'Les roues tournent librement, rien ne frotte',
      'Le bouton de la carte et l’interrupteur restent accessibles',
      'Le mBot peut encore rouler et défiler',
    ],
  },
  videos: {
    sortes: [
      { id: 'promo', titre: 'Vidéo de promotion', but: 'Donner envie de soutenir l’écurie : présentez l’équipe, le mBot, votre style. Courte et rythmée.', dureeConseillee: '30 à 60 secondes' },
      { id: 'reportage', titre: 'Reportage du projet', but: 'Raconter le projet : les étapes, les essais, les difficultés, les réussites. Les photos des rapports peuvent servir.', dureeConseillee: '1 à 3 minutes' },
    ],
    casesStoryboard: 6,
    formats: ['mp4', 'webm', 'mov'],
  },
});
