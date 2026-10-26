// Circuit des séances : 10 séances (1 h 30) ou 11 séances (1 h), affiche en séance 8, tournoi.
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../site/js/moteur/calendrier.js');
const { calendrier } = require('../site/js/moteur/catalogue.js');

const avec = (classes) => Object.assign({}, calendrier, { classes });

test('classe à 1 h 30 : 10 séances, affiche en 8, tournoi en 10', () => {
  const c = C.circuit(avec({}), '3B');
  assert.equal(c.modele, 'heure-et-demie');
  assert.equal(c.seances.length, 10);
  assert.equal(c.seanceAffiche, 8);
  assert.deepEqual(c.tournoi, [10]);
  assert.equal(c.seances[9].tournoi, true);
  assert.equal(c.seances[9].jour, null);
  assert.equal(c.seances[7].affiche, true);
});

test('classe à 1 h : 11 séances, tournoi en deux jours (10 et 11)', () => {
  const c = C.circuit(avec({ '3B': 'une-heure' }), '3B');
  assert.equal(c.seances.length, 11);
  assert.equal(c.seanceAffiche, 8);
  assert.deepEqual(c.seances.filter((s) => s.tournoi).map((s) => [s.numero, s.jour]), [[10, 1], [11, 2]]);
});

test('un groupe prend le réglage de sa classe, sauf s’il a le sien', () => {
  const cal = avec({ '3D': 'une-heure', '3C2': 'une-heure' });
  assert.equal(C.circuit(cal, '3D1').modele, 'une-heure');
  assert.equal(C.circuit(cal, '3C1').modele, 'heure-et-demie');
  assert.equal(C.circuit(cal, '3C2').modele, 'une-heure');
});

test('chaque séance a un titre et un objectif', () => {
  for (const nom of Object.keys(calendrier.modeles)) {
    const c = C.circuit(Object.assign({}, calendrier, { defaut: nom }), '3B');
    for (const s of c.seances) assert.ok(s.titre && s.objectif, `${nom}, séance ${s.numero}`);
  }
});

test('séances restantes avant le tournoi', () => {
  const c = C.circuit(avec({ '3B': 'une-heure' }), '3B');
  assert.equal(C.seancesAvantTournoi(c, 5), 5);
  assert.equal(C.seancesAvantTournoi(c, 11), 0);
});
