// Données du projet : identité et réglages, lues comme le navigateur les lit.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { projet } = require('../site/js/moteur/catalogue.js');

test('l’identité du projet est complète', () => {
  assert.equal(projet.id, 'mbot-challenge');
  assert.equal(projet.dossier, 'MBOT CHALLENGE');
  assert.deepEqual(projet.niveaux, ['3']);
  assert.equal(projet.maxEleves, 4);
});

test('les pages des élèves et du professeur chargent chaque script local qu’elles citent', () => {
  for (const page of ['index.html', 'prof.html', 'regie.html', 'ecran.html']) verifierPage(page);
});

function verifierPage(page) {
  const html = fs.readFileSync(path.join(__dirname, '..', 'site', page), 'utf8');
  const locaux = [...html.matchAll(/(?:data-src|src|href)="([^"]+)"/g)].map((m) => m[1]).filter((u) => !/^https?:/.test(u));
  assert.ok(locaux.length >= 4, page);
  for (const u of locaux) assert.ok(fs.existsSync(path.join(__dirname, '..', 'site', u)), page + ' : ' + u);
}

test('aucune clé du navigateur d’un autre projet', () => {
  const dossier = path.join(__dirname, '..', 'site', 'js');
  for (const f of fs.readdirSync(dossier).filter((n) => n.endsWith('.js'))) {
    const t = fs.readFileSync(path.join(dossier, f), 'utf8');
    assert.doesNotMatch(t, /atelier-cereales|distributeur/i, f);
  }
});
