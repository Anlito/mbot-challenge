// Écuries fictives pour essayer l'outil (prénoms inventés, aucune donnée d'élève) : npm run exemples
//   → exemples/3B/MBOT CHALLENGE/<Prénom_Prénom>/<Prénom_Prénom>.json
// L'outil professeur (jalon 4) lira ce dossier comme celui d'une vraie classe.
const fs = require('node:fs');
const path = require('node:path');
const P = require('../site/js/moteur/progression.js');
const E = require('../site/js/moteur/ecurie.js');
const LB = require(require('./dependances-tests.js').noyau);
const { parcours, defis } = require('../site/js/moteur/catalogue.js');
const { permis } = E.paquets(parcours);

// Exercices du permis réussis par un équipier (comme l'écran de Labo Blocs les note).
function reussir(d, prenom, combien) {
  const vue = E.vuePermis(d, prenom, permis);
  for (const e of permis.exercices.slice(0, combien)) {
    if (e.libre) LB.noterTermine(vue, e, e.solutionReference);
    else LB.noterVerification(vue, e, { reussi: true, programme: e.solutionReference });
  }
}

const SORTIE = path.join(__dirname, '..', 'exemples', '3B', 'MBOT CHALLENGE');
const ECURIES = [
  { nom: 'Foudre', couleur: '#1565C0', eleves: ['Inès', 'Lucas', 'Maël', 'Sofia'], avance: 8, essais: [{ defi: 'mbc-d1', temps: 41.2, compteur: 2, reussi: true, reglage: 'vitesse 50 %', qui: 'Lucas' }, { defi: 'mbc-d1', temps: 35.4, compteur: 0, reussi: true, reglage: 'vitesse 60 %', qui: 'Maël' }], roles: { Inès: ['chef', 'pilote'], Lucas: ['programmeur'], Maël: ['reporter', 'essais'], Sofia: ['designer'] } },
  { nom: 'Turbo', couleur: '#B4530A', eleves: ['Adam', 'Chloé', 'Noah'], avance: 5, roles: { Adam: ['chef', 'programmeur'], Chloé: ['reporter', 'designer'], Noah: ['essais', 'pilote'] } },
  { nom: 'Les Castors', couleur: '#6A4FB3', eleves: ['Jade', 'Tom', 'Lina', 'Hugo'], avance: 7, roles: { Jade: ['chef'], Tom: ['programmeur', 'pilote'], Lina: ['reporter'], Hugo: ['designer', 'essais'] } },
  { nom: 'Néon', couleur: '#0E7C7B', eleves: ['Rayan', 'Léa', 'Emma'], avance: 8, essais: [{ defi: 'mbc-d3', temps: 58, compteur: 3, reussi: true, reglage: 'virages à 40 %', qui: 'Rayan' }], roles: { Rayan: ['chef', 'essais'], Léa: ['programmeur'], Emma: ['reporter', 'designer'] } },
  { nom: 'Orbite', couleur: '#9C2F6B', eleves: ['Yanis', 'Manon', 'Paul', 'Zoé'], roles: { Yanis: ['chef'], Manon: ['reporter'], Paul: ['programmeur'], Zoé: ['designer', 'pilote'] } },
  { nom: 'Vortex', couleur: '#2F6B2F', eleves: ['Sami', 'Alice', 'Nina'], roles: {} },
  { nom: '', couleur: null, eleves: ['Louis', 'Mila', 'Ethan'], roles: {} },
];

fs.rmSync(SORTIE, { recursive: true, force: true });
for (const e of ECURIES) {
  const d = P.creerProgression({ eleves: e.eleves, classe: '3B' });
  Object.assign(d.ecurie, { nom: e.nom, couleur: e.couleur, roles: e.roles });
  if (Object.keys(e.roles).length) d.ecurie.historiqueRoles.push({ date: d.creeLe, roles: e.roles });
  // Avancement varié : le premier équipier va plus vite que les autres.
  e.eleves.forEach((p, i) => reussir(d, p, Math.max(0, (e.avance || 0) - 2 * i)));
  for (const x of e.essais || []) E.ajouterEssai(d, x, defis);
  const nom = P.nomEquipe(d.equipe.eleves);
  const dossier = path.join(SORTIE, nom);
  fs.mkdirSync(dossier, { recursive: true });
  fs.writeFileSync(path.join(dossier, nom + '.json'), JSON.stringify(d, null, 1));
}
console.log(`${ECURIES.length} écuries fictives dans ${path.relative(path.join(__dirname, '..'), SORTIE)}`);
