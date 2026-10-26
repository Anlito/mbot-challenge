// Écurie : identité, rôles, permis mBot de chaque équipier, défis, carnet d'essais.
const test = require('node:test');
const assert = require('node:assert/strict');
const LB = require(require('../tools/dependances-tests.js').noyau);
const P = require('../site/js/moteur/progression.js');
const E = require('../site/js/moteur/ecurie.js');
const { parcours, defis } = require('../site/js/moteur/catalogue.js');

const nouvelle = () => P.creerProgression({ eleves: ['Inès', 'Lucas', 'Maël'], classe: '3B' });
const { permis, defis: paquetDefis } = E.paquets(parcours);

// L'équipier réussit ses exercices (comme l'écran de Labo Blocs les note).
function reussir(d, prenom, combien) {
  const vue = E.vuePermis(d, prenom, permis);
  for (const e of permis.exercices.slice(0, combien)) {
    if (e.libre) LB.noterTermine(vue, e, e.solutionReference);
    else LB.noterVerification(vue, e, { reussi: true, programme: e.solutionReference });
  }
}

test('identité : nom de 2 à 24 caractères, couleur de la palette', () => {
  const d = nouvelle();
  assert.match(E.changerIdentite(d, { nom: ' F ' }).raison, /au moins 2/);
  assert.match(E.changerIdentite(d, { nom: 'Foudre', couleur: 'rouge' }).raison, /palette/);
  assert.equal(d.ecurie.nom, '');
  assert.deepEqual(E.changerIdentite(d, { nom: '  Les   Castors ', couleur: '#6A4FB3' }), { ok: true });
  assert.equal(d.ecurie.nom, 'Les Castors');
  assert.equal(d.ecurie.couleur, '#6A4FB3');
});

test('les couleurs d’écurie sont lisibles avec un texte blanc (contraste ≥ 4,5:1)', () => {
  const lum = (hex) => {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  for (const c of E.COULEURS) assert.ok(1.05 / (lum(c.valeur) + 0.05) >= 4.5, c.nom);
});

test('rôles : un chef, un reporter, jamais la même personne ; cumul permis ; historique gardé', () => {
  const d = nouvelle();
  assert.match(E.changerRoles(d, { Inès: ['chef', 'reporter'] }).raison, /Inès ne peut pas être à la fois/);
  assert.match(E.changerRoles(d, { Inès: ['programmeur'], Maël: ['reporter'] }).raison, /chef de projet/);
  assert.match(E.changerRoles(d, { Inès: ['chef'], Lucas: ['chef'], Maël: ['reporter'] }).raison, /un seul/);
  assert.match(E.changerRoles(d, { Inès: ['chef'] }).raison, /reporter/);
  assert.deepEqual(d.ecurie.historiqueRoles, []);
  assert.deepEqual(E.changerRoles(d, { Inès: ['chef', 'pilote'], Lucas: ['programmeur', 'inconnu'], Maël: ['reporter', 'essais'] }), { ok: true });
  assert.deepEqual(d.ecurie.roles, { Inès: ['chef', 'pilote'], Lucas: ['programmeur'], Maël: ['reporter', 'essais'] });
  assert.equal(E.avecRole(d, 'reporter'), 'Maël');
  assert.equal(d.ecurie.historiqueRoles.length, 1);
  E.changerRoles(d, { Inès: ['chef', 'pilote'], Lucas: ['programmeur'], Maël: ['reporter', 'essais'] });
  assert.equal(d.ecurie.historiqueRoles.length, 1, 'rien de changé : pas de nouvelle ligne');
  E.changerRoles(d, { Inès: ['reporter'], Lucas: ['chef'], Maël: [] });
  assert.equal(d.ecurie.historiqueRoles.length, 2);
});

test('le parcours se coupe en 8 exercices (permis) et 5 défis', () => {
  assert.deepEqual(permis.exercices.map((e) => e.numero), ['1', '2', '3', '4', '5', '6', '7', '8']);
  assert.deepEqual(paquetDefis.exercices.map((e) => e.numero), ['D1', 'D2', 'D3', 'D4', 'D5']);
  assert.deepEqual(defis.map((x) => x.id), paquetDefis.exercices.map((e) => e.id));
});

test('permis : chaque équipier a ses propres exercices, rangés dans le fichier de l’écurie', () => {
  const d = nouvelle();
  reussir(d, 'Inès', 3);
  assert.equal(E.etatPermis(d, 'Inès', permis).reussis, 3);
  assert.equal(E.etatPermis(d, 'Lucas', permis).reussis, 0, 'les réussites d’Inès ne comptent pas pour Lucas');
  assert.equal(E.etatPermis(d, 'Inès', permis).statuts['mbc-04'], 'a_faire');
  assert.equal(E.etatPermis(d, 'Inès', permis).statuts['mbc-05'], 'verrouille');
  // Le fichier relu garde tout.
  const r = P.lireSauvegarde(JSON.stringify(d));
  assert.equal(r.ok, true);
  assert.equal(E.etatPermis(r.donnees, 'Inès', permis).reussis, 3);
  assert.equal(r.donnees.programmation.exercices['mbc-01'], undefined, 'la rubrique de l’écurie ne reçoit pas les exercices');
});

test('les défis s’ouvrent dès qu’un équipier a fini son permis', () => {
  const d = nouvelle();
  reussir(d, 'Lucas', 7);
  assert.equal(E.defisOuverts(d, permis), false);
  reussir(d, 'Lucas', 8);
  assert.equal(E.etatPermis(d, 'Lucas', permis).fini, true);
  assert.equal(E.defisOuverts(d, permis), true);
  assert.deepEqual(Object.values(E.etatDefis(d, paquetDefis)), ['a_faire', 'a_faire', 'a_faire', 'a_faire', 'a_faire']);
  LB.noterTermine(d, paquetDefis.exercices[2], { demarrage: [], boucle: [] });
  assert.equal(E.etatDefis(d, paquetDefis)['mbc-d3'], 'reussi');
});

test('carnet d’essais : vérifications, meilleur temps, défilé au plus près de 30 s', () => {
  const d = nouvelle();
  assert.match(E.ajouterEssai(d, { defi: 'x' }, defis).raison, /Choisis le défi/);
  assert.match(E.ajouterEssai(d, { defi: 'mbc-d1', temps: 'vite' }, defis).raison, /secondes/);
  assert.match(E.ajouterEssai(d, { defi: 'mbc-d2', temps: 50, compteur: 4 }, defis).raison, /de 0 à 3/);
  assert.match(E.ajouterEssai(d, { defi: 'mbc-d1' }, defis).raison, /au moins/);
  assert.equal(E.ajouterEssai(d, { defi: 'mbc-d1', temps: 41.26, compteur: 2, reussi: true, reglage: 'vitesse 60 %' }, defis).ok, true);
  assert.equal(E.ajouterEssai(d, { defi: 'mbc-d1', temps: 35.4, compteur: 0, reussi: true, reglage: 'vitesse 70 %' }, defis).ok, true);
  assert.equal(E.ajouterEssai(d, { defi: 'mbc-d1', temps: 20, reussi: false, reglage: 'vitesse 90 %', hypothese: 'trop vite dans le virage' }, defis).ok, true);
  const d1 = defis.find((x) => x.id === 'mbc-d1');
  assert.equal(E.meilleurEssai(d, d1).temps, 35.4, 'un essai raté ne compte pas');
  assert.equal(E.essaisDe(d, 'mbc-d1').length, 3);
  assert.equal(d.ecurie.essais[0].temps, 41.3);
  const d5 = defis.find((x) => x.id === 'mbc-d5');
  E.ajouterEssai(d, { defi: 'mbc-d5', temps: 24, reussi: true }, defis);
  E.ajouterEssai(d, { defi: 'mbc-d5', temps: 31, reussi: true }, defis);
  E.ajouterEssai(d, { defi: 'mbc-d5', temps: 40, reussi: true }, defis);
  assert.equal(E.meilleurEssai(d, d5).temps, 31);
});

test('couleur libre : le thème de l’interface reste lisible, quelle que soit la couleur choisie', () => {
  const d = nouvelle();
  assert.deepEqual(E.changerIdentite(d, { nom: 'Les Soleils', couleur: '#ffe600' }), { ok: true });
  assert.equal(d.ecurie.couleur, '#FFE600');
  const blanc = '#FFFFFF', jaune = '#FFC21A', encre = '#14202E';
  for (const c of ['#FFE600', '#FFFFFF', '#000000', '#00FF00', '#FF0000', '#7FDBFF', '#F012BE', '#1565C0', '#808080']) {
    const t = E.theme(c);
    assert.ok(E.contraste(t.principal, blanc) >= 4.5, c + ' : bouton (texte blanc)');
    assert.ok(E.contraste(t.nuit, blanc) >= 12, c + ' : bandeau');
    assert.ok(E.contraste(t.nuit, jaune) >= 4.5, c + ' : repères jaunes sur le bandeau');
    assert.ok(E.contraste(t.nuit2, blanc) >= 7, c + ' : onglets');
    assert.ok(E.contraste(t.nuitTexte, t.nuit) >= 7, c + ' : texte secondaire du bandeau');
    assert.ok(E.contraste(t.pale, encre) >= 7, c + ' : texte sur fond pâle');
    assert.ok(E.contraste(t.ecurieFond, t.ecurieTexte) >= 4.5, c + ' : pastille');
  }
  assert.equal(E.theme('#1565C0').principal, '#1565C0', 'une couleur déjà lisible n’est pas changée');
  assert.equal(E.theme('#FFE600').ecurieTexte, encre, 'sur du jaune, la pastille écrit en sombre');
});
