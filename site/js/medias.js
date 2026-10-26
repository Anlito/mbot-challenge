// Médias de l'écurie (logo, puis affiche, STL, photos, vidéos) : rangés dans le dossier de l'écurie, à côté du fichier
// Prénom_Prénom.json, qui ne garde que leur nom. Il faut le dossier de l'écurie (Chrome, Edge) ; s'il n'est pas connu
// (sauvegarde ouverte seule, autorisation à renouveler), l'élève le choisit une fois.
(function (global) {
  'use strict';

  const A = global.Atelier;
  const urls = new Map(); // chemin → URL d'objet, gardée le temps de la séance

  const disponible = () => typeof global.showDirectoryPicker === 'function';

  // Dossier de l'écurie avec le droit demandé ('read' ou 'readwrite'). À appeler après un clic de l'élève.
  async function dossier(session, mode) {
    let d = session.dossier || (await A.dossierEcurie.retrouver(session.donnees));
    if (d) {
      try {
        if ((await d.queryPermission({ mode })) === 'granted' || (await d.requestPermission({ mode })) === 'granted') return (session.dossier = d);
      } catch {
        /* dossier plus accessible : on le redemande */
      }
    }
    if (!disponible()) throw new Error('Sur ce navigateur, les fichiers de l’écurie ne peuvent pas être rangés : utilise Chrome ou Edge.');
    let choisi;
    try {
      choisi = await global.showDirectoryPicker({ id: A.projet.id + '-ecurie', mode });
    } catch (e) {
      if (e && e.name === 'AbortError') return null;
      throw e;
    }
    // Le bon dossier contient le fichier de l'écurie.
    try {
      await choisi.getFileHandle(A.fichiers.nomFichier(session.donnees));
    } catch {
      throw new Error(`Ce dossier n’est pas celui de ton écurie : choisis le dossier « ${A.nomEquipe(session.donnees.equipe.eleves)} ».`);
    }
    session.dossier = choisi;
    await A.dossierEcurie.memoriser(session.donnees, choisi);
    return choisi;
  }

  async function sousDossier(racine, chemin, creer) {
    let d = racine;
    for (const nom of chemin) d = await d.getDirectoryHandle(nom, { create: !!creer });
    return d;
  }

  // Enregistre un fichier ; renvoie son chemin dans le dossier de l'écurie (« logo.png », « affiche/v2.png »), ou null
  // si l'élève a fermé la fenêtre de choix du dossier.
  async function ecrire(session, chemin, blob) {
    const racine = await dossier(session, 'readwrite');
    if (!racine) return null;
    const morceaux = chemin.split('/');
    const d = await sousDossier(racine, morceaux.slice(0, -1), true);
    const h = await d.getFileHandle(morceaux[morceaux.length - 1], { create: true });
    const flux = await h.createWritable();
    await flux.write(blob);
    await flux.close();
    const ancien = urls.get(chemin);
    if (ancien) URL.revokeObjectURL(ancien);
    urls.set(chemin, URL.createObjectURL(blob));
    return chemin;
  }

  // URL d'un fichier de l'écurie pour l'afficher, sans fenêtre : null si le droit de lecture n'est pas encore donné.
  async function url(session, chemin) {
    if (!chemin) return null;
    if (urls.has(chemin)) return urls.get(chemin);
    const racine = session.dossier || (await A.dossierEcurie.retrouver(session.donnees));
    if (!racine) return null;
    try {
      if ((await racine.queryPermission({ mode: 'read' })) !== 'granted') return null;
      const morceaux = chemin.split('/');
      const d = await sousDossier(racine, morceaux.slice(0, -1), false);
      const f = await (await d.getFileHandle(morceaux[morceaux.length - 1])).getFile();
      const u = URL.createObjectURL(f);
      urls.set(chemin, u);
      return u;
    } catch {
      return null;
    }
  }

  // Texte d'un fichier de l'écurie écrit par le professeur (validations.json), sans fenêtre : null s'il n'est pas lisible.
  async function lireTexte(session, chemin) {
    const racine = session.dossier || (await A.dossierEcurie.retrouver(session.donnees));
    if (!racine) return null;
    try {
      if ((await racine.queryPermission({ mode: 'read' })) !== 'granted') return null;
      return await (await (await racine.getFileHandle(chemin)).getFile()).text();
    } catch {
      return null;
    }
  }

  // Fichier de l'écurie (pour l'analyser : STL…), en demandant le droit de lecture si besoin (après un clic).
  async function lireFichier(session, chemin) {
    const racine = await dossier(session, 'read');
    if (!racine) return null;
    const morceaux = chemin.split('/');
    const d = await sousDossier(racine, morceaux.slice(0, -1), false);
    return (await d.getFileHandle(morceaux[morceaux.length - 1])).getFile();
  }

  // Image choisie par l'élève, réduite pour rester légère (côté le plus long : max px), en PNG.
  async function reduireImage(fichier, max) {
    const image = await createImageBitmap(fichier);
    const k = Math.min(1, max / Math.max(image.width, image.height));
    const toile = document.createElement('canvas');
    toile.width = Math.round(image.width * k);
    toile.height = Math.round(image.height * k);
    toile.getContext('2d').drawImage(image, 0, 0, toile.width, toile.height);
    return new Promise((ok) => toile.toBlob(ok, 'image/png'));
  }

  A.medias = { disponible, dossier, ecrire, url, lireTexte, lireFichier, reduireImage };
})(this);
