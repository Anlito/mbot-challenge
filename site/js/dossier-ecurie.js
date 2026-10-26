// Dossier de l'écurie, mémorisé entre deux ouvertures de la page (IndexedDB) : il servira à ranger les médias
// (affiche, STL, photos, vidéos) dans ses sous-dossiers. Le navigateur peut demander de renouveler l'autorisation.
(function (global) {
  'use strict';

  const A = global.Atelier;
  const BASE = A.projet.id + '-dossiers';
  const cle = (d) => JSON.stringify([d.equipe.classe || '', A.nomEquipe(d.equipe.eleves)]);

  function base() {
    return new Promise((ok, ko) => {
      const r = indexedDB.open(BASE, 1);
      r.onupgradeneeded = () => r.result.createObjectStore('dossiers');
      r.onsuccess = () => ok(r.result);
      r.onerror = () => ko(r.error);
    });
  }

  async function memoriser(d, dossier) {
    try {
      const db = await base();
      await new Promise((ok, ko) => {
        const t = db.transaction('dossiers', 'readwrite');
        t.objectStore('dossiers').put(dossier, cle(d));
        t.oncomplete = ok;
        t.onerror = () => ko(t.error);
      });
      db.close();
    } catch {
      /* dossier redemandé au prochain besoin */
    }
  }

  async function retrouver(d) {
    try {
      const db = await base();
      const h = await new Promise((ok, ko) => {
        const r = db.transaction('dossiers').objectStore('dossiers').get(cle(d));
        r.onsuccess = () => ok(r.result || null);
        r.onerror = () => ko(r.error);
      });
      db.close();
      return h;
    } catch {
      return null;
    }
  }

  A.dossierEcurie = { memoriser, retrouver };
})(this);
