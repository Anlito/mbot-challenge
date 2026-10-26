// Tournoi : ordre de passage, tirage de la Récolte, résultats, points par place, égalités, classements.
const test = require('node:test');
const assert = require('node:assert/strict');
const T = require('../site/js/moteur/tournoi.js');
const { lireDonnees } = require('../site/js/moteur/catalogue.js');

const config = lireDonnees('tournoi.js', 'definirTournoi');
const nouv = (noms, classe) => T.creerTournoi(noms.map((n) => ({ cle: n, nom: n })), classe || '3B', config);
// Hasard reproductible pour les tests.
const graine = (s) => () => ((s = (s * 16807) % 2147483647) / 2147483647);

test('le tournoi : 6 épreuves, jours repris du réglage, ordre de passage tiré au sort', () => {
  const t = nouv(['A', 'B', 'C', 'D', 'E']);
  assert.deepEqual(config.epreuves.map((e) => e.id), ['style', 'ligne', 'obstacles', 'labyrinthe', 'recolte', 'affiche']);
  assert.equal(t.jours.ligne, 1);
  assert.equal(t.jours.recolte, 2);
  const o = T.tirerOrdre(t, graine(7));
  assert.deepEqual([...o].sort(), ['A', 'B', 'C', 'D', 'E']);
  assert.equal(T.lireTournoi(JSON.stringify(t)).ok, true);
  assert.equal(T.lireTournoi('{"format":"autre"}').ok, false);
});

test('Récolte : chaque écurie joue 2 matchs contre 2 adversaires différents, jamais deux de suite si possible', () => {
  for (const n of [3, 4, 5, 6, 7, 8]) {
    const t = nouv('ABCDEFGH'.slice(0, n).split(''));
    const m = T.tirerRecolte(t, graine(n));
    assert.equal(m.length, n);
    for (const x of t.ecuries) {
      const siens = m.filter((y) => y.a === x.cle || y.b === x.cle);
      assert.equal(siens.length, 2, `${n} écuries : ${x.cle}`);
      const adversaires = siens.map((y) => (y.a === x.cle ? y.b : y.a));
      assert.notEqual(adversaires[0], adversaires[1]);
    }
    // Avec 4 écuries, deux matchs de suite sont inévitables (chaque match prend la moitié des écuries).
    if (n >= 5) for (let i = 1; i < m.length; i++) assert.ok(![m[i].a, m[i].b].some((c) => [m[i - 1].a, m[i - 1].b].includes(c)), `${n} écuries : match ${i + 1}`);
  }
});

test('défi 1 : temps + malus de 5 s, places et points (10, 8, 6…), abandon = 1 point', () => {
  const t = nouv(['A', 'B', 'C', 'D']);
  T.noterPassage(t, config, 'ligne', 'A', { temps: 34.2, malus: 0 });
  T.noterPassage(t, config, 'ligne', 'B', { temps: 30.1, malus: 1 }); // 35,1
  T.noterPassage(t, config, 'ligne', 'C', { temps: 40, abandon: true });
  const c = T.classementEpreuve(t, config, 'ligne');
  assert.deepEqual(c.map((l) => [l.cle, l.place, l.points, l.valeur]), [
    ['A', 1, 10, '34,2 s'], ['B', 2, 8, '35,1 s'], ['C', 3, 1, 'abandon'], ['D', null, null, 'pas encore passé'],
  ]);
  assert.match(c[1].detail, /30,1 s · \+1 sortie de piste/);
});

test('défi 2 : validé seulement si les 3 objets sont sortis en 2 minutes', () => {
  const t = nouv(['A', 'B', 'C']);
  T.noterPassage(t, config, 'obstacles', 'A', { temps: 95, objets: 3 });
  T.noterPassage(t, config, 'obstacles', 'B', { temps: 120, objets: 2 });
  T.noterPassage(t, config, 'obstacles', 'C', { temps: 80, objets: 3, malus: 1 }); // 85
  const c = T.classementEpreuve(t, config, 'obstacles');
  assert.deepEqual(c.map((l) => [l.cle, l.place, l.points, l.valeur]), [['C', 1, 10, '85 s'], ['A', 2, 8, '95 s'], ['B', 3, 1, 'non validé']]);
});

test('égalités : même place, mêmes points, la place suivante saute', () => {
  const t = nouv(['A', 'B', 'C', 'D']);
  for (const [c, v] of [['A', 30], ['B', 25], ['C', 30], ['D', 12]]) t.resultats.affiche[c] = v;
  const c = T.classementEpreuve(t, config, 'affiche');
  assert.deepEqual(c.map((l) => [l.cle, l.place, l.points]), [['A', 1, 10], ['C', 1, 10], ['B', 3, 6], ['D', 4, 5]]);
});

test('Récolte : victoires (nul = ½), puis balles', () => {
  const t = nouv(['A', 'B', 'C']);
  t.resultats.recolte.matchs = [
    { id: 'm1', a: 'A', b: 'B', scoreA: 5, scoreB: 3, fini: true },
    { id: 'm2', a: 'B', b: 'C', scoreA: 4, scoreB: 4, fini: true },
    { id: 'm3', a: 'C', b: 'A', scoreA: 6, scoreB: 2, fini: true },
  ];
  const c = T.classementEpreuve(t, config, 'recolte');
  assert.deepEqual(c.map((l) => [l.cle, l.place, l.points]), [['C', 1, 10], ['A', 2, 8], ['B', 3, 6]]);
  assert.equal(c[0].valeur, '1,5 victoire');
});

test('jury du style, classement général sur deux jours, toutes classes', () => {
  const t = nouv(['A', 'B', 'C']);
  t.resultats.style.classement = ['B', 'A', 'C'];
  T.noterPassage(t, config, 'ligne', 'A', { temps: 30 });
  T.noterPassage(t, config, 'ligne', 'B', { temps: 31 });
  T.noterPassage(t, config, 'ligne', 'C', { temps: 32 });
  t.resultats.affiche = { A: 1, B: 2, C: 40 }; // jour 2
  const jour1 = T.classementGeneral(t, config, 1);
  assert.deepEqual(jour1.map((l) => [l.cle, l.total, l.place]), [['A', 18, 1], ['B', 18, 1], ['C', 12, 3]]);
  assert.equal(jour1[0].points.affiche, undefined, 'le jour 1 ne montre pas les épreuves du jour 2');
  const general = T.classementGeneral(t, config);
  assert.deepEqual(general.map((l) => [l.cle, l.total]), [['C', 22], ['B', 26], ['A', 24]].sort((a, b) => b[1] - a[1]));
  // Toutes classes : une 2ᵉ classe de 2 écuries.
  const u = nouv(['X', 'Y'], '3C1');
  u.resultats.style.classement = ['X', 'Y'];
  T.noterPassage(u, config, 'ligne', 'X', { temps: 29 });
  T.noterPassage(u, config, 'ligne', 'Y', { temps: 50 });
  const tc = T.classementToutesClasses([t, u], config);
  assert.equal(tc.length, 5);
  assert.equal(tc.find((x) => x.nom === 'X').classe, '3C1');
  // X : 1ᵉʳ du jury de sa classe (comme B) et meilleur temps de toutes les classes.
  const x = tc.find((l) => l.nom === 'X');
  assert.ok(x.place <= 2, JSON.stringify(tc));
});
