// Livrables de l'écurie (rubrique « ecurie » du fichier) : séances (points de départ et de fin), rapports du reporter,
// affiche, style du mBot (pièces STL, photos, défilé), vidéos (storyboard, fichiers), QCM et chaînes.
// Les fichiers (photos, affiche, STL, vidéos) sont dans le dossier de l'écurie ; ici, seulement leur chemin.

(function (global) {
  'use strict';

  const enNode = typeof module === 'object' && module.exports;
  const P = enNode ? require('./progression.js') : global.Atelier;

  const texte = (x, max) => String(x === undefined || x === null ? '' : x).trim().slice(0, max || 2000);
  const nouvelId = (prefixe) => prefixe + '-' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);

  // ---------- Séances ----------
  //   seance : { numero, depart: { date, taches: [{ id, texte, qui, minutes, livrable, fait }] } | null,
  //              fin: { date, reste, bloquant } | null, pointProf: date | null }

  function seances(d) {
    return d.ecurie.seances;
  }

  // Séance en cours : la dernière, si son point de fin n'est pas fait.
  function seanceEnCours(d) {
    const s = seances(d)[seances(d).length - 1];
    return s && !s.fin ? s : null;
  }

  // Numéro proposé pour la prochaine séance.
  const prochainNumero = (d) => (seances(d).length ? seances(d)[seances(d).length - 1].numero + 1 : 1);

  // Ce qui restait à faire à la fin de la séance précédente (repris au point de départ).
  function resteDeLaFois(d) {
    const fermees = seances(d).filter((s) => s.fin);
    const derniere = fermees[fermees.length - 1];
    return derniere ? { numero: derniere.numero, reste: derniere.fin.reste, taches: derniere.depart ? derniere.depart.taches.filter((t) => t.fait === false) : [] } : null;
  }

  function nettoyerTaches(d, taches) {
    const propres = [];
    for (const t of taches || []) {
      const tache = texte(t.texte, 200);
      if (!tache) continue;
      const qui = t.qui === 'tous' || d.equipe.eleves.includes(t.qui) ? t.qui : '';
      const minutes = t.minutes === '' || t.minutes === null || t.minutes === undefined ? null : Math.round(Number(t.minutes));
      propres.push({ id: t.id || nouvelId('tache'), texte: tache, qui, minutes: minutes > 0 && minutes <= 120 ? minutes : null, livrable: texte(t.livrable, 40), fait: t.fait === true ? true : t.fait === false ? false : null });
    }
    return propres;
  }

  // Point de départ du chef de projet : chaque équipier a au moins une tâche.
  function pointDeDepart(d, numero, taches) {
    const n = Math.round(Number(numero));
    if (!(n >= 1 && n <= 20)) return { ok: false, raison: 'Choisis le numéro de la séance.' };
    const propres = nettoyerTaches(d, taches);
    if (!propres.length) return { ok: false, raison: 'Écris au moins une tâche.' };
    const sansQui = propres.find((t) => !t.qui);
    if (sansQui) return { ok: false, raison: `Choisis qui s’occupe de « ${sansQui.texte} ».` };
    const oublie = d.equipe.eleves.find((p) => !propres.some((t) => t.qui === p || t.qui === 'tous'));
    if (oublie) return { ok: false, raison: `${oublie} n’a pas encore de tâche : chacun doit avoir quelque chose à faire.` };
    let s = seanceEnCours(d);
    if (s && s.numero !== n && s.depart) return { ok: false, raison: `La séance ${s.numero} n’a pas encore son point de fin.` };
    if (!s) {
      if (seances(d).some((x) => x.numero === n)) return { ok: false, raison: `La séance ${n} a déjà eu son point de fin : choisis le bon numéro.` };
      s = { numero: n, depart: null, fin: null, pointProf: null };
      seances(d).push(s);
    }
    s.numero = n;
    s.depart = { date: P.maintenant(), taches: propres };
    return { ok: true, seance: s };
  }

  // Point de fin : chaque tâche faite ou pas, ce qui reste, ce qui bloque.
  function pointDeFin(d, faits, reste, bloquant) {
    const s = seanceEnCours(d);
    if (!s || !s.depart) return { ok: false, raison: 'Faites d’abord le point de départ de la séance.' };
    const manque = s.depart.taches.find((t) => faits[t.id] !== true && faits[t.id] !== false);
    if (manque) return { ok: false, raison: `Dis si « ${manque.texte} » est fait ou pas encore.` };
    for (const t of s.depart.taches) t.fait = faits[t.id];
    const r = texte(reste, 600);
    if (s.depart.taches.some((t) => !t.fait) && !r) return { ok: false, raison: 'Écris ce qu’il reste à faire pour la prochaine fois.' };
    s.fin = { date: P.maintenant(), reste: r, bloquant: texte(bloquant, 600) };
    return { ok: true, seance: s };
  }

  // ---------- Rapports du reporter ----------
  //   rapport : { seance, date, texte, photos: [chemin], remisLe }

  function rapportDe(d, numero) {
    let r = d.ecurie.rapports.find((x) => x.seance === numero);
    if (!r) {
      r = { seance: numero, date: P.maintenant(), texte: '', photos: [], remisLe: null };
      d.ecurie.rapports.push(r);
      d.ecurie.rapports.sort((a, b) => a.seance - b.seance);
    }
    return r;
  }

  function remettreRapport(d, numero, contenu, photosMax) {
    const t = texte(contenu, 4000);
    if (t.length < 40) return { ok: false, raison: 'Le rapport est encore trop court : raconte ce que l’écurie a fait (au moins 2 phrases).' };
    const r = rapportDe(d, numero);
    if (r.photos.length > (photosMax || 6)) return { ok: false, raison: `Garde au plus ${photosMax || 6} photos.` };
    r.texte = t;
    r.remisLe = P.maintenant();
    return { ok: true, rapport: r };
  }

  // Nom libre d'une nouvelle photo du rapport : rapports/seance-05-1.jpg, -2…
  function cheminPhoto(d, numero, extension) {
    const r = rapportDe(d, numero);
    const base = `rapports/seance-${String(numero).padStart(2, '0')}-`;
    let i = 1;
    while (r.photos.includes(base + i + '.' + extension)) i++;
    return base + i + '.' + extension;
  }

  // ---------- Affiche ----------

  function affiche(d) {
    const l = d.ecurie.livrables;
    l.affiche = l.affiche || { versions: [], controle: {} };
    return l.affiche;
  }
  const extension = (nom) => (String(nom).match(/\.([a-z0-9]+)$/i) || [])[1] ? String(nom).match(/\.([a-z0-9]+)$/i)[1].toLowerCase() : '';

  // Nouvelle version déposée : affiche/affiche-v3.png. Les anciennes versions restent.
  function cheminAffiche(d, nomFichier, formats) {
    const ext = extension(nomFichier);
    if (!formats.includes(ext)) return { ok: false, raison: 'L’affiche doit être une image (PNG, JPG) ou un PDF exporté de Canva.' };
    return { ok: true, chemin: `affiche/affiche-v${affiche(d).versions.length + 1}.${ext === 'jpeg' ? 'jpg' : ext}` };
  }
  function ajouterVersionAffiche(d, chemin) {
    affiche(d).versions.push({ chemin, date: P.maintenant() });
  }

  // ---------- Style du mBot ----------

  function style(d) {
    const l = d.ecurie.livrables;
    l.style = l.style || { pieces: [], photos: [], description: '', defile: '', cahier: {} };
    return l.style;
  }

  // Fichier STL (Tinkercad, en mm) : nombre de triangles et dimensions de la boîte englobante. buffer : ArrayBuffer.
  function analyserStl(buffer) {
    const octets = new Uint8Array(buffer);
    const vue = new DataView(buffer);
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    const prendre = (x, k) => {
      if (x < min[k]) min[k] = x;
      if (x > max[k]) max[k] = x;
    };
    if (octets.length >= 84) {
      const n = vue.getUint32(80, true);
      if (n > 0 && 84 + n * 50 === octets.length) {
        for (let i = 0; i < n; i++) {
          const base = 84 + i * 50 + 12; // on saute la normale
          for (let v = 0; v < 3; v++) for (let k = 0; k < 3; k++) prendre(vue.getFloat32(base + v * 12 + k * 4, true), k);
        }
        return { triangles: n, dims: max.map((m, k) => arrondi(m - min[k])) };
      }
    }
    const t = new TextDecoder().decode(octets);
    if (!/^\s*solid/i.test(t)) return null;
    let sommets = 0;
    for (const m of t.matchAll(/vertex\s+(\S+)\s+(\S+)\s+(\S+)/gi)) {
      for (let k = 0; k < 3; k++) prendre(parseFloat(m[k + 1]), k);
      sommets++;
    }
    return sommets >= 3 ? { triangles: Math.floor(sommets / 3), dims: max.map((m, k) => arrondi(m - min[k])) } : null;
  }
  const arrondi = (x) => Math.round(x * 10) / 10;

  // Contrôle des dimensions (côtés triés du plus grand au plus petit, comme l'imprimante peut tourner la pièce).
  //   max : [a, b, c] en mm, ou null (pas de contrôle). { ok: true | false | null, depasse: [côtés trop grands] }
  function controlerDimensions(dims, max) {
    if (!max) return { ok: null, depasse: [] };
    const piece = [...dims].sort((a, b) => b - a);
    const limite = [...max].sort((a, b) => b - a);
    const depasse = piece.filter((x, i) => x > limite[i] + 0.3);
    return { ok: !depasse.length, depasse };
  }

  function ajouterPiece(d, chemin, analyse) {
    style(d).pieces.push({ chemin, triangles: analyse.triangles, dims: analyse.dims, date: P.maintenant() });
  }

  // ---------- Vidéos ----------

  function videos(d, sorte) {
    const l = d.ecurie.livrables;
    l.videos = l.videos || {};
    l.videos[sorte] = l.videos[sorte] || { storyboard: [], fichier: null, date: null };
    return l.videos[sorte];
  }

  function changerStoryboard(d, sorte, cases) {
    videos(d, sorte).storyboard = (cases || []).map((c) => ({ image: texte(c.image, 300), son: texte(c.son, 300), duree: Number(c.duree) > 0 ? Math.min(600, Math.round(Number(c.duree))) : null }));
  }
  const dureeStoryboard = (d, sorte) => videos(d, sorte).storyboard.reduce((s, c) => s + (c.duree || 0), 0);

  // ---------- Comprendre le mBot ----------

  function comprendre(d) {
    d.ecurie.comprendre = d.ecurie.comprendre || { qcm: [], chaines: {} };
    return d.ecurie.comprendre;
  }

  // reponses : [index choisi par question]. Note sur 20 arrondie au demi-point (comme le QCM d'origine).
  function noterQcm(d, questions, reponses, qui) {
    if (reponses.length !== questions.length || reponses.some((r) => !Number.isInteger(r))) return { ok: false, raison: 'Réponds à toutes les questions.' };
    const bonnes = questions.reduce((n, q, i) => n + (reponses[i] === q.bonne ? 1 : 0), 0);
    const essai = { date: P.maintenant(), qui: texte(qui, 30), bonnes, total: questions.length, note: Math.round((bonnes / questions.length) * 40) / 2, reponses: reponses.slice() };
    comprendre(d).qcm.push(essai);
    return { ok: true, essai };
  }

  function changerChaines(d, textes, fonctions) {
    const c = comprendre(d);
    for (const f of fonctions) c.chaines[f.id] = texte(textes[f.id], 400);
    return fonctions.filter((f) => c.chaines[f.id].length >= 10).length;
  }

  const api = {
    seanceEnCours,
    prochainNumero,
    resteDeLaFois,
    pointDeDepart,
    pointDeFin,
    rapportDe,
    remettreRapport,
    cheminPhoto,
    affiche,
    cheminAffiche,
    ajouterVersionAffiche,
    style,
    analyserStl,
    controlerDimensions,
    ajouterPiece,
    videos,
    changerStoryboard,
    dureeStoryboard,
    comprendre,
    noterQcm,
    changerChaines,
    extension,
  };
  if (enNode) module.exports = api;
  else Object.assign((global.Atelier = global.Atelier || {}), { livrables: api });
})(this);
