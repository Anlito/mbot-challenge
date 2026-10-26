// Circuit des séances d'une classe : modèle (1 h ou 1 h 30), séances, séance limite de l'affiche, séances du tournoi.

(function (global) {
  'use strict';

  const enNode = typeof module === 'object' && module.exports;

  // Le groupe 3D1 prend le réglage de sa classe 3D s'il n'a pas le sien.
  function modeleDe(calendrier, classe) {
    const c = String(classe || '').toUpperCase();
    const reglages = calendrier.classes || {};
    const groupe = c.match(/^(\d+[A-Z])\d+$/);
    const nom = reglages[c] || (groupe && reglages[groupe[1]]) || calendrier.defaut;
    const modele = calendrier.modeles[nom] || calendrier.modeles[calendrier.defaut];
    return { nom: calendrier.modeles[nom] ? nom : calendrier.defaut, modele };
  }

  //   { modele, libelle, seanceAffiche, tournoi: [numéros], seances: [{ numero, titre, objectif, affiche, tournoi, jour }] }
  //   jour : 1 ou 2 pour un tournoi sur deux séances, null sinon.
  function circuit(calendrier, classe) {
    const { nom, modele } = modeleDe(calendrier, classe);
    const seances = [];
    for (let n = 1; n <= modele.seances; n++) {
      const etape = modele.etapes.find((e) => n >= e.de && n <= e.a) || { titre: '', objectif: '' };
      const rangTournoi = modele.tournoi.indexOf(n);
      seances.push({
        numero: n,
        titre: etape.titre,
        objectif: etape.objectif,
        affiche: n === modele.affiche,
        tournoi: rangTournoi >= 0,
        jour: rangTournoi >= 0 && modele.tournoi.length > 1 ? rangTournoi + 1 : null,
      });
    }
    return { modele: nom, libelle: modele.libelle, seanceAffiche: modele.affiche, tournoi: modele.tournoi.slice(), seances };
  }

  // Combien de séances avant le tournoi (séance en cours comprise) ; 0 le jour du tournoi.
  function seancesAvantTournoi(c, seanceEnCours) {
    return Math.max(0, c.tournoi[0] - seanceEnCours);
  }

  const api = { modeleDe, circuit, seancesAvantTournoi };
  if (enNode) module.exports = api;
  else Object.assign((global.Atelier = global.Atelier || {}), { calendrierClasse: api });
})(this);
