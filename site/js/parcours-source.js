// Le parcours « mbot-challenge » publié par Labo Blocs vient d'être chargé : il doit être lisible par ce moteur et
// avoir ses 8 exercices et ses 5 défis (sinon l'écurie ne pourrait pas retrouver son travail).
(function (global) {
  'use strict';
  const A = global.Atelier, LB = global.LaboBlocs;
  const brut = LB.parcoursDefinis.find((p) => p.id === A.projet.parcours);
  if (!brut) throw new Error('Parcours ' + A.projet.parcours + ' indisponible.');
  const problemes = LB.controler(brut, LB.VERSION_MOTEUR);
  const ids = brut.exercices.map((e) => e.id);
  const attendus = A.defis.map((x) => x.id);
  if (problemes.length || !attendus.every((id) => ids.includes(id)) || ids.filter((id) => !attendus.includes(id)).length !== 8) {
    throw new Error('Le parcours publié n’est pas compatible avec cet outil.');
  }
})(this);
