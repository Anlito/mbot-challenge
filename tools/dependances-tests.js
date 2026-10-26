// Labo Blocs pour les tests (moteur publié en ligne), téléchargé dans .cache/ : exclu du dépôt et de l'archive.
const fs = require('node:fs');
const path = require('node:path');

const cache = path.join(__dirname, '..', '.cache', 'labo-blocs');
const noyau = path.join(cache, 'labo-blocs-noyau.js');

async function preparer() {
  fs.mkdirSync(cache, { recursive: true });
  for (const [url, fichier] of [['module/labo-blocs-noyau.js', noyau]]) {
    try {
      const r = await fetch('https://anlito.github.io/labo-blocs/' + url, { signal: AbortSignal.timeout(20000) });
      if (!r.ok) throw new Error('réponse ' + r.status);
      fs.writeFileSync(fichier, await r.text());
    } catch (e) {
      // Hors ligne : la copie déjà téléchargée sert.
      if (!fs.existsSync(fichier)) throw new Error('Labo Blocs indisponible pour les tests (' + url + ') : ' + e.message);
      console.log('Labo Blocs injoignable : la copie de .cache sert.');
    }
  }
}

if (require.main === module) preparer().catch((e) => { console.error(e.message); process.exitCode = 1; });
module.exports = { noyau };
