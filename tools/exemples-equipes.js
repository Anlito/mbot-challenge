// Écuries fictives pour essayer l'outil (prénoms inventés, aucune donnée d'élève) : npm run exemples
//   → exemples/3B/MBOT CHALLENGE/<Prénom_Prénom>/<Prénom_Prénom>.json
// L'outil professeur (jalon 4) lira ce dossier comme celui d'une vraie classe.
const fs = require('node:fs');
const path = require('node:path');
const P = require('../site/js/moteur/progression.js');

const SORTIE = path.join(__dirname, '..', 'exemples', '3B', 'MBOT CHALLENGE');
const ECURIES = [
  { nom: 'Foudre', couleur: '#1565C0', eleves: ['Inès', 'Lucas', 'Maël', 'Sofia'], roles: { Inès: ['chef', 'pilote'], Lucas: ['programmeur'], Maël: ['reporter', 'essais'], Sofia: ['designer'] } },
  { nom: 'Turbo', couleur: '#B4530A', eleves: ['Adam', 'Chloé', 'Noah'], roles: { Adam: ['chef', 'programmeur'], Chloé: ['reporter', 'designer'], Noah: ['essais', 'pilote'] } },
  { nom: 'Les Castors', couleur: '#6A4FB3', eleves: ['Jade', 'Tom', 'Lina', 'Hugo'], roles: { Jade: ['chef'], Tom: ['programmeur', 'pilote'], Lina: ['reporter'], Hugo: ['designer', 'essais'] } },
  { nom: 'Néon', couleur: '#0E7C7B', eleves: ['Rayan', 'Léa', 'Emma'], roles: { Rayan: ['chef', 'essais'], Léa: ['programmeur'], Emma: ['reporter', 'designer'] } },
  { nom: 'Orbite', couleur: '#9C2F6B', eleves: ['Yanis', 'Manon', 'Paul', 'Zoé'], roles: { Yanis: ['chef'], Manon: ['reporter'], Paul: ['programmeur'], Zoé: ['designer', 'pilote'] } },
  { nom: 'Vortex', couleur: '#2F6B2F', eleves: ['Sami', 'Alice', 'Nina'], roles: {} },
  { nom: '', couleur: null, eleves: ['Louis', 'Mila', 'Ethan'], roles: {} },
];

fs.rmSync(SORTIE, { recursive: true, force: true });
for (const e of ECURIES) {
  const d = P.creerProgression({ eleves: e.eleves, classe: '3B' });
  Object.assign(d.ecurie, { nom: e.nom, couleur: e.couleur, roles: e.roles });
  if (Object.keys(e.roles).length) d.ecurie.historiqueRoles.push({ date: d.creeLe, roles: e.roles });
  const nom = P.nomEquipe(d.equipe.eleves);
  const dossier = path.join(SORTIE, nom);
  fs.mkdirSync(dossier, { recursive: true });
  fs.writeFileSync(path.join(dossier, nom + '.json'), JSON.stringify(d, null, 1));
}
console.log(`${ECURIES.length} écuries fictives dans ${path.relative(path.join(__dirname, '..'), SORTIE)}`);
