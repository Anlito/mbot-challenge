// Outil professeur : lecture des écuries, résumé, alertes, indices, notes, exports.
const test = require('node:test');
const assert = require('node:assert/strict');
const LB = require(require('../tools/dependances-tests.js').noyau);
const P = require('../site/js/moteur/progression.js');
const E = require('../site/js/moteur/ecurie.js');
const L = require('../site/js/moteur/livrables.js');
const C = require('../site/js/moteur/classe.js');
const cat = require('../site/js/moteur/catalogue.js');

const paquets = E.paquets(cat.parcours);
const ctx = {
  paquets,
  defis: cat.defis,
  calendrier: cat.calendrier,
  comprendre: cat.lireDonnees('comprendre.js', 'definirComprendre'),
  livrables: cat.lireDonnees('livrables.js', 'definirLivrables'),
};
const notation = cat.lireDonnees('notation.js', 'definirNotation');

function ecurie(eleves, nom) {
  const d = P.creerProgression({ eleves, classe: '3B' });
  E.changerIdentite(d, { nom, couleur: '#1565C0' });
  E.changerRoles(d, { [eleves[0]]: ['chef'], [eleves[1]]: ['reporter'] });
  return d;
}

test('lecture : fichiers étrangers ignorés, copie la plus récente gardée, tri par nom', () => {
  const a = ecurie(['Inès', 'Lucas'], 'Foudre');
  const b = ecurie(['Adam', 'Chloé'], 'Apex');
  const ancienne = JSON.parse(JSON.stringify(a));
  ancienne.modifieLe = '2000-01-01T00:00:00';
  ancienne.ecurie.nom = 'Vieux nom';
  const r = C.lireEcuries([
    { chemin: 'Inès_Lucas/Inès_Lucas.json', texte: JSON.stringify(a) },
    { chemin: 'Inès_Lucas/copie.json', texte: JSON.stringify(ancienne) },
    { chemin: 'Adam_Chloé/Adam_Chloé.json', texte: JSON.stringify(b) },
    { chemin: 'validations.json', texte: '{"autre":1}' },
  ]);
  assert.deepEqual(r.ecuries.map((x) => P.nomAffiche(x.donnees)), ['Apex', 'Foudre']);
  assert.equal(r.ignores.length, 1);
});

test('résumé et indices : permis, défis, livrables', () => {
  const d = ecurie(['Inès', 'Lucas'], 'Foudre');
  const vue = E.vuePermis(d, 'Inès', paquets.permis);
  for (const e of paquets.permis.exercices) {
    if (e.libre) LB.noterTermine(vue, e, e.solutionReference);
    else LB.noterVerification(vue, e, { reussi: true, programme: e.solutionReference });
  }
  E.ajouterEssai(d, { defi: 'mbc-d1', temps: 35, reussi: true, hypothese: 'trop vite' }, cat.defis);
  L.ajouterVersionAffiche(d, 'affiche/affiche-v1.png');
  const res = C.resumer(d, ctx);
  assert.equal(res.permisFinis, 1);
  assert.equal(res.defisOuverts, true);
  assert.equal(res.affiches, 1);
  const i = C.indices(res, ctx);
  assert.match(i.programme, /Inès 8\/8, Lucas 0\/8/);
  assert.match(i.tests, /1 essai\(s\) noté\(s\), dont 1 avec une hypothèse/);
});

test('alertes : point de départ, rapport, blocage, affiche en retard, exercice qui résiste', () => {
  const d = ecurie(['Inès', 'Lucas'], 'Foudre');
  const aujourdhui = P.maintenant().slice(0, 10);
  const textes = () => C.alertes(d, C.resumer(d, ctx), ctx, aujourdhui).map((a) => a.sorte);
  assert.deepEqual(textes(), ['depart'], 'actif aujourd’hui sans point de départ');
  L.pointDeDepart(d, 7, [{ texte: 'Défi 1', qui: 'tous' }]);
  const t = L.seanceEnCours(d).depart.taches[0];
  L.pointDeFin(d, { [t.id]: false }, 'Finir le défi', 'Le capteur droit voit noir');
  const s = textes();
  assert.ok(s.includes('rapport') && s.includes('bloque') && s.includes('affiche'), s.join(','));
  // Six vérifications ratées sur le même exercice.
  const vue = E.vuePermis(d, 'Lucas', paquets.permis);
  const ex3 = paquets.permis.exercices[2];
  LB.noterTermine(vue, paquets.permis.exercices[0], {});
  LB.noterTermine(vue, paquets.permis.exercices[1], {});
  LB.noterOuverture(vue, ex3.id);
  for (let i = 0; i < 6; i++) LB.noterVerification(vue, ex3, { reussi: false, programme: {} });
  const a = C.alertes(d, C.resumer(d, ctx), ctx, aujourdhui).find((x) => x.sorte === 'exercice');
  assert.match(a.texte, /Lucas : exercice 3, 6 vérifications sans réussite/);
});

test('notes : critères évalués seulement, coefficients, ajustement borné et motivé', () => {
  const d = ecurie(['Inès', 'Lucas', 'Maël'], 'Foudre');
  const cle = C.cleEcurie(d);
  const ev = C.evaluationsVides('3B');
  assert.equal(C.noteGroupe(ev, notation, cle).note, null);
  const e = C.evaluationDe(ev, cle);
  e.niveaux = { programme: 3, tests: 4 };
  assert.deepEqual(C.noteGroupe(ev, notation, cle), { note: 17.5, evalues: 2, total: 7 });
  ev.coefficients.programme = 3;
  assert.equal(C.noteGroupe(ev, notation, cle).note, 16.5, '(3 × 3 + 4) / 16 × 20 = 16,25 → 16,5');
  e.ajustements = { Inès: { valeur: 1, motif: 'Points de séance très clairs' }, Lucas: { valeur: -5, motif: 'Hors tâche' } };
  const n = C.notesEleves(ev, notation, cle, d.equipe.eleves);
  assert.deepEqual(n.map((x) => [x.prenom, x.ajustement, x.note]), [['Inès', 1, 17.5], ['Lucas', -2, 14.5], ['Maël', 0, 16.5]]);
  // Exports.
  const t = C.lignesEleves([{ cle, donnees: d }], ev, notation);
  assert.equal(t.lignes.length, 3);
  assert.equal(t.lignes[0][4], 'Atteint');
  assert.equal(t.lignes[0][3], 'Chef de projet');
  const p = C.lignesPronote([{ cle, donnees: d }], ev, notation);
  assert.equal(p.entete.length, 2 + 7 + 1);
  const texte = C.csv(t);
  assert.match(texte.split('\r\n')[1], /^3B;Foudre;Inès;Chef de projet;Atteint;Dépassé;;;;;;16,5;1;Points de séance très clairs;17,5$/);
  assert.equal(C.lireEvaluations(JSON.stringify(ev)).ok, true);
  assert.equal(C.lireEvaluations('{"format":"autre"}').ok, false);
});
