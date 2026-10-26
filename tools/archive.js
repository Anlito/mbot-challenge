// Archive ZIP du site, à déposer sur le dossier réseau : npm run archive
//   → dist/mbot-challenge.zip, qui contient le dossier « mbot-challenge » (le site) et le LISEZ-MOI.
// Une fois décompressée, on ouvre mbot-challenge/index.html (élèves) ou prof.html (professeur).

const fs = require('node:fs');
const path = require('node:path');
const { zip } = require('../site/js/moteur/xlsx.js');

const RACINE = path.join(__dirname, '..');
const SITE = path.join(RACINE, 'site');
const SORTIE = path.join(RACINE, 'dist');
const DOSSIER = 'mbot-challenge';


const fichiers = [];
(function parcourir(dossier, prefixe) {
  for (const e of fs.readdirSync(dossier, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (e.name.startsWith('_') || e.name.startsWith('.')) continue; // fichiers d'essai, fichiers cachés
    const chemin = path.join(dossier, e.name);
    if (e.isDirectory()) parcourir(chemin, prefixe + e.name + '/');
    else fichiers.push({ nom: prefixe + e.name, contenu: fs.readFileSync(chemin) });
  }
})(SITE, DOSSIER + '/');
fichiers.push({ nom: 'LISEZ-MOI.md', contenu: fs.readFileSync(path.join(RACINE, 'LISEZ-MOI.md')) });

fs.mkdirSync(SORTIE, { recursive: true });
const archive = path.join(SORTIE, 'mbot-challenge.zip');
fs.writeFileSync(archive, zip(fichiers));
const taille = fs.statSync(archive).size;
console.log(`${fichiers.length} fichiers · ${(taille / 1024 / 1024).toFixed(1)} Mo → ${path.relative(RACINE, archive)}`);
