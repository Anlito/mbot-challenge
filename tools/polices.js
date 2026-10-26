// Copie les polices de la charte (paquets @fontsource, licence SIL OFL) dans site/polices : npm run polices
// Le site n'en charge aucune en ligne.
const fs = require('node:fs');
const path = require('node:path');

const RACINE = path.join(__dirname, '..');
const SORTIE = path.join(RACINE, 'site', 'polices');
const POLICES = [
  ['saira-condensed', [600, 700, 800]],
  ['barlow', [400, 500, 600, 700]],
  ['jetbrains-mono', [500, 700]],
];

fs.mkdirSync(SORTIE, { recursive: true });
for (const [nom, graisses] of POLICES) {
  const dossier = path.join(RACINE, 'node_modules', '@fontsource', nom);
  for (const g of graisses) {
    const fichier = `${nom}-latin-${g}-normal.woff2`;
    fs.copyFileSync(path.join(dossier, 'files', fichier), path.join(SORTIE, fichier));
  }
  fs.copyFileSync(path.join(dossier, 'LICENSE'), path.join(SORTIE, `LICENCE-${nom}.txt`));
}
console.log('Polices copiées dans site/polices.');
