// Données du projet : scripts definirXxx({...}) de site/donnees/, lisibles en ouvrant index.html depuis un dossier.
//   definirProjetAtelier  identité du projet (donnees/projet.js)
//   definirCalendrier     circuit des séances par classe (donnees/calendrier.js)
// Les classes et le début du chemin des dossiers viennent des réglages du collège (Labo Blocs, donnees/college.js).
// Le parcours d'exercices de Labo Blocs arrive au jalon 1.

(function (global) {
  'use strict';

  const enNode = typeof module === 'object' && module.exports;

  // Sous Node (tests, outils) : lit un fichier de données du site sans navigateur.
  function lireDonnees(fichier, nomFonction) {
    const fs = require('node:fs');
    const vm = require('node:vm');
    const path = require('node:path');
    let valeur = null;
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', '..', 'donnees', fichier), 'utf8'), {
      [nomFonction]: (v) => (valeur = JSON.parse(JSON.stringify(v))),
    });
    return valeur;
  }

  if (enNode) {
    const api = { lireDonnees };
    Object.defineProperty(api, 'projet', { get: () => lireDonnees('projet.js', 'definirProjetAtelier') });
    Object.defineProperty(api, 'calendrier', { get: () => lireDonnees('calendrier.js', 'definirCalendrier') });
    module.exports = api;
    return;
  }

  const Atelier = (global.Atelier = global.Atelier || {});

  // Projet + réglages du collège : niveaux → classes du collège ; dossier → chemin de la classe + dossier + {equipe}.
  // Recalculés quand la version en ligne des réglages du collège arrive.
  global.definirProjetAtelier = (projet) => {
    Atelier.projet = projet;
    const L = global.LaboBlocs || {};
    const reglages = { niveaux: projet.niveaux, cheminProjet: [projet.dossier] };
    const appliquer = () => {
      const r = L.projetAvecCollege ? L.projetAvecCollege(reglages) : reglages;
      if (r.classes && r.classes.length) Atelier.classes = r.classes;
      if (r.cheminSauvegarde) Atelier.cheminSauvegarde = r.cheminSauvegarde;
      if (Atelier.surCollege) Atelier.surCollege();
    };
    appliquer();
    if (global.document) global.document.addEventListener(L.EVENEMENT_COLLEGE || 'labo-blocs:college', appliquer);
  };
  global.definirCalendrier = (calendrier) => (Atelier.calendrier = calendrier);
})(this);
