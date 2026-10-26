// Livrables : séances, rapports, affiche, STL, vidéos, QCM, chaînes.
const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../site/js/moteur/progression.js');
const L = require('../site/js/moteur/livrables.js');
const { lireDonnees } = require('../site/js/moteur/catalogue.js');

const nouvelle = () => P.creerProgression({ eleves: ['Inès', 'Lucas', 'Maël'], classe: '3B' });
const comprendre = lireDonnees('comprendre.js', 'definirComprendre');
const livrables = lireDonnees('livrables.js', 'definirLivrables');

test('point de départ : chaque équipier a une tâche, chaque tâche a quelqu’un', () => {
  const d = nouvelle();
  assert.match(L.pointDeDepart(d, 1, []).raison, /au moins une tâche/);
  assert.match(L.pointDeDepart(d, 1, [{ texte: 'Exercice 1' }]).raison, /Choisis qui/);
  assert.match(L.pointDeDepart(d, 1, [{ texte: 'Exercice 1', qui: 'Inès' }, { texte: 'Affiche', qui: 'Lucas' }]).raison, /Maël n’a pas encore de tâche/);
  const r = L.pointDeDepart(d, 1, [{ texte: 'Exercice 1', qui: 'tous', minutes: 30, livrable: 'Permis mBot' }]);
  assert.equal(r.ok, true);
  assert.equal(L.seanceEnCours(d).numero, 1);
  // Corriger le plan de la même séance reste possible.
  assert.equal(L.pointDeDepart(d, 1, [{ texte: 'Exercice 1', qui: 'tous' }, { texte: 'Logo', qui: 'Maël', minutes: 999 }]).ok, true);
  assert.equal(L.seanceEnCours(d).depart.taches[1].minutes, null, 'durée hors limites ignorée');
  assert.match(L.pointDeDepart(d, 2, [{ texte: 'x', qui: 'tous' }]).raison, /séance 1 n’a pas encore son point de fin/);
});

test('point de fin : chaque tâche faite ou non, le reste à faire est repris la fois suivante', () => {
  const d = nouvelle();
  assert.match(L.pointDeFin(d, {}, '', '').raison, /point de départ/);
  L.pointDeDepart(d, 4, [{ texte: 'Virage serré', qui: 'Lucas' }, { texte: 'Prénoms sur l’affiche', qui: 'Maël' }, { texte: 'Exercice 6', qui: 'Inès' }]);
  const [a, b, c] = L.seanceEnCours(d).depart.taches;
  assert.match(L.pointDeFin(d, { [a.id]: true }, '', '').raison, /est fait ou pas encore/);
  assert.match(L.pointDeFin(d, { [a.id]: true, [b.id]: false, [c.id]: true }, '', '').raison, /reste à faire/);
  assert.equal(L.pointDeFin(d, { [a.id]: true, [b.id]: false, [c.id]: true }, 'Finir les prénoms', 'Le capteur droit voit noir').ok, true);
  assert.equal(L.seanceEnCours(d), null);
  assert.equal(L.prochainNumero(d), 5);
  const reste = L.resteDeLaFois(d);
  assert.equal(reste.numero, 4);
  assert.equal(reste.reste, 'Finir les prénoms');
  assert.deepEqual(reste.taches.map((t) => t.texte), ['Prénoms sur l’affiche']);
  assert.match(L.pointDeDepart(d, 4, [{ texte: 'x', qui: 'tous' }]).raison, /déjà eu son point de fin/);
});

test('rapport : assez long pour être utile, photos nommées par séance', () => {
  const d = nouvelle();
  assert.match(L.remettreRapport(d, 3, 'Trop court.').raison, /trop court/);
  assert.equal(L.cheminPhoto(d, 3, 'jpg'), 'rapports/seance-03-1.jpg');
  L.rapportDe(d, 3).photos.push('rapports/seance-03-1.jpg');
  assert.equal(L.cheminPhoto(d, 3, 'jpg'), 'rapports/seance-03-2.jpg');
  const r = L.remettreRapport(d, 3, 'Lucas a réussi le virage serré. Maël a chronométré cinq tours, le meilleur fait 34 secondes.', 6);
  assert.equal(r.ok, true);
  assert.ok(r.rapport.remisLe);
  assert.equal(d.ecurie.rapports.length, 1);
});

test('affiche : versions numérotées, formats image ou PDF', () => {
  const d = nouvelle();
  assert.match(L.cheminAffiche(d, 'affiche.docx', livrables.affiche.formats).raison, /PNG, JPG/);
  assert.equal(L.cheminAffiche(d, 'Mon Affiche.JPEG', livrables.affiche.formats).chemin, 'affiche/affiche-v1.jpg');
  L.ajouterVersionAffiche(d, 'affiche/affiche-v1.jpg');
  assert.equal(L.cheminAffiche(d, 'canva.pdf', livrables.affiche.formats).chemin, 'affiche/affiche-v2.pdf');
});

test('STL : dimensions d’un fichier binaire et d’un fichier texte, contrôle selon l’imprimante', () => {
  // Binaire : un triangle de 30 × 20 × 10 mm.
  const buf = new ArrayBuffer(84 + 50);
  const v = new DataView(buf);
  v.setUint32(80, 1, true);
  [[0, 0, 0], [30, 0, 0], [0, 20, 10]].forEach((p, i) => p.forEach((x, k) => v.setFloat32(84 + 12 + i * 12 + k * 4, x, true)));
  assert.deepEqual(L.analyserStl(buf), { triangles: 1, dims: [30, 20, 10] });
  const ascii = new TextEncoder().encode('solid aileron\nfacet normal 0 0 1\nouter loop\nvertex 0 0 0\nvertex 84 0 0\nvertex 0 40 22\nendloop\nendfacet\nendsolid').buffer;
  assert.deepEqual(L.analyserStl(ascii), { triangles: 1, dims: [84, 40, 22] });
  assert.equal(L.analyserStl(new TextEncoder().encode('pas un stl').buffer), null);
  assert.deepEqual(L.controlerDimensions([84, 40, 22], null), { ok: null, depasse: [] });
  assert.equal(L.controlerDimensions([84, 40, 22], [100, 100, 50]).ok, true);
  assert.equal(L.controlerDimensions([22, 84, 40], [50, 100, 100]).ok, true, 'la pièce peut être tournée');
  assert.deepEqual(L.controlerDimensions([120, 40, 22], [100, 100, 50]).depasse, [120]);
});

test('vidéos : storyboard et durée totale', () => {
  const d = nouvelle();
  L.changerStoryboard(d, 'promo', [{ image: 'Le mBot sort du garage', son: 'Musique', duree: 8 }, { image: 'L’équipe', son: 'Nous sommes…', duree: '12' }, { image: '', son: '', duree: 'x' }]);
  assert.equal(L.videos(d, 'promo').storyboard.length, 3);
  assert.equal(L.dureeStoryboard(d, 'promo'), 20);
  assert.equal(L.videos(d, 'reportage').fichier, null);
});

test('QCM : 15 questions, note sur 20 au demi-point ; chaînes : 7 fonctions', () => {
  const d = nouvelle();
  const qs = comprendre.qcm;
  assert.equal(qs.length, 15);
  assert.match(L.noterQcm(d, qs, [0, 1]).raison, /toutes les questions/);
  const reponses = qs.map((q, i) => (i < 13 ? q.bonne : (q.bonne + 1) % 4));
  const r = L.noterQcm(d, qs, reponses, 'Inès');
  assert.equal(r.essai.bonnes, 13);
  assert.equal(r.essai.note, 17.5);
  assert.equal(comprendre.chaines.length, 7);
  const n = L.changerChaines(d, { acquerir: 'Le suiveur de ligne voit la ligne noire', traiter: 'court' }, comprendre.chaines);
  assert.equal(n, 1);
  assert.equal(d.ecurie.comprendre.chaines.traiter, 'court');
});
