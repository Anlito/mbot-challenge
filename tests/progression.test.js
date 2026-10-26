// Fichier d'une écurie : création, relecture, refus d'un fichier étranger ou trop récent, rôles.
const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../site/js/moteur/progression.js');

const equipe = { eleves: ['Inès', 'Lucas', 'Maël', 'Sofia'], classe: '3B' };

test('une nouvelle écurie a sa rubrique « ecurie » et une rubrique « programmation » de Labo Blocs', () => {
  const d = P.creerProgression(equipe);
  assert.equal(d.application, 'mbot-challenge');
  assert.equal(d.formatVersion, 1);
  assert.deepEqual(d.equipe.eleves, equipe.eleves);
  assert.equal(d.equipe.classe, '3B');
  assert.equal(d.programmation.format, 'labo-blocs/sauvegarde');
  assert.deepEqual(d.ecurie, P.ecurieVide());
  assert.equal(P.nomAffiche(d), 'Inès, Lucas, Maël, Sofia');
});

test('le fichier se relit tel quel', () => {
  const d = P.creerProgression(equipe);
  d.ecurie.nom = 'Foudre';
  const r = P.lireSauvegarde(JSON.stringify(d, null, 1));
  assert.equal(r.ok, true);
  assert.equal(r.donnees.ecurie.nom, 'Foudre');
  assert.equal(P.nomAffiche(r.donnees), 'Foudre');
});

test('une rubrique « ecurie » incomplète est complétée sans rien perdre', () => {
  const d = P.creerProgression(equipe);
  d.ecurie = { format: 1, nom: 'Turbo', autreChose: 42 };
  const r = P.lireSauvegarde(JSON.stringify(d));
  assert.equal(r.ok, true);
  assert.equal(r.donnees.ecurie.nom, 'Turbo');
  assert.equal(r.donnees.ecurie.autreChose, 42);
  assert.deepEqual(r.donnees.ecurie.rapports, []);
});

test('un fichier illisible, d’une autre application ou trop récent est refusé avec une phrase claire', () => {
  assert.match(P.lireSauvegarde('{pas du json').raison, /illisible/);
  assert.match(P.lireSauvegarde(JSON.stringify({ application: 'atelier-cereales', formatVersion: 2 })).raison, /autre application/);
  const d = P.creerProgression(equipe);
  assert.match(P.lireSauvegarde(JSON.stringify(Object.assign({}, d, { formatVersion: 99 }))).raison, /plus récente/);
  const e = P.creerProgression(equipe);
  e.ecurie.format = 99;
  assert.match(P.lireSauvegarde(JSON.stringify(e)).raison, /plus récente/);
  assert.match(P.lireSauvegarde(JSON.stringify(Object.assign({}, d, { equipe: { eleves: [] } }))).raison, /équipiers/);
});

test('toucher met à jour la date de modification au format de Labo Blocs', () => {
  const d = P.creerProgression(equipe);
  d.modifieLe = '2000-01-01T00:00:00';
  P.toucher(d);
  assert.match(d.modifieLe, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
  assert.notEqual(d.modifieLe, '2000-01-01T00:00:00');
});

test('le chef de projet ne peut pas être aussi le reporter ; les autres cumuls sont permis', () => {
  assert.deepEqual(P.rolesIncompatibles({ Inès: ['chef', 'pilote'], Maël: ['reporter', 'essais'] }), []);
  assert.deepEqual(P.rolesIncompatibles({ Inès: ['chef', 'reporter'], Lucas: ['programmeur'] }), ['Inès']);
});
