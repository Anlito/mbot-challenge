// Outil professeur : lecture des fichiers des écuries d'une classe, résumé de chaque écurie, alertes, indices pour la
// notation, note de groupe et notes individuelles, lignes des exports (Excel, CSV, Pronote).
//
// Évaluations du professeur (son fichier, jamais dans les dossiers des élèves) :
//   { format: 'mbot-challenge/evaluations', version: 1, classe, coefficients: { critère: n }, ecuries: { clé: {
//       niveaux: { critère: 1-4 }, commentaire, ajustements: { prénom: { valeur, motif } }, points: { n° séance: date } } } }

(function (global) {
  'use strict';

  const enNode = typeof module === 'object' && module.exports;
  const P = enNode ? require('./progression.js') : global.Atelier;
  const E = enNode ? require('./ecurie.js') : global.Atelier.ecurie;
  const L = enNode ? require('./livrables.js') : global.Atelier.livrables;
  const K = enNode ? require('./calendrier.js') : global.Atelier.calendrierClasse;

  const FORMAT_EVALUATIONS = 'mbot-challenge/evaluations';
  const cleEcurie = (d) => (d.equipe.classe || '') + '/' + P.nomEquipe(d.equipe.eleves);
  const jourDe = (iso) => String(iso || '').slice(0, 10);

  // ---------- Lecture ----------

  // fichiers : [{ chemin, texte }] → { ecuries: [{ cle, chemin, donnees }], ignores: [{ chemin, raison }] }.
  // Deux fichiers de la même écurie (copie, ancienne sauvegarde) : le plus récent est gardé.
  function lireEcuries(fichiers) {
    const parCle = new Map();
    const ignores = [];
    for (const f of fichiers) {
      const r = P.lireSauvegarde(f.texte);
      if (!r.ok) {
        ignores.push({ chemin: f.chemin, raison: r.raison });
        continue;
      }
      const cle = cleEcurie(r.donnees);
      const avant = parCle.get(cle);
      if (!avant || String(r.donnees.modifieLe) > String(avant.donnees.modifieLe)) parCle.set(cle, { cle, chemin: f.chemin, donnees: r.donnees });
    }
    const ecuries = [...parCle.values()].sort((a, b) => P.nomAffiche(a.donnees).localeCompare(P.nomAffiche(b.donnees), 'fr'));
    return { ecuries, ignores };
  }

  // ---------- Résumé ----------

  // ctx : { paquets: { permis, defis }, defis, calendrier, comprendre, livrables }
  function resumer(d, ctx) {
    const permis = d.equipe.eleves.map((p) => Object.assign({ prenom: p }, E.etatPermis(d, p, ctx.paquets.permis)));
    const defisOuverts = permis.some((x) => x.fini);
    const statutsDefis = E.etatDefis(d, ctx.paquets.defis);
    const seances = d.ecurie.seances;
    const derniere = seances[seances.length - 1] || null;
    const fermees = seances.filter((s) => s.fin);
    const rapportsRemis = d.ecurie.rapports.filter((r) => r.remisLe).length;
    const a = L.affiche(d);
    const s = L.style(d);
    const v = ['promo', 'reportage'].map((x) => L.videos(d, x));
    const c = L.comprendre(d);
    const fonctions = ctx.comprendre.chaines.filter((f) => (c.chaines[f.id] || '').length >= 10).length;
    const essais = d.ecurie.essais;
    return {
      nom: P.nomAffiche(d),
      couleur: d.ecurie.couleur,
      eleves: d.equipe.eleves.slice(),
      chef: E.avecRole(d, 'chef'),
      reporter: E.avecRole(d, 'reporter'),
      seance: derniere ? { numero: derniere.numero, etat: derniere.fin ? 'finie' : derniere.depart ? 'en_cours' : 'a_lancer', depart: derniere.depart ? derniere.depart.date : null } : null,
      seancesFinies: fermees.length,
      rapportsRemis,
      permis,
      permisFinis: permis.filter((x) => x.fini).length,
      defisOuverts,
      defisPrets: Object.values(statutsDefis).filter((x) => x === 'reussi').length,
      defisTotal: ctx.paquets.defis.exercices.length,
      essais: essais.length,
      essaisAvecHypothese: essais.filter((x) => x.hypothese).length,
      affiches: a.versions.length,
      afficheControle: ctx.livrables.affiche.controle.filter((x) => a.controle[x]).length,
      pieces: s.pieces.length,
      photosStyle: s.photos.length,
      cahier: ctx.livrables.style.cahierDesCharges.filter((x) => s.cahier[x]).length,
      defileEcrit: s.defile.length >= 20,
      videosDeposees: v.filter((x) => x.fichier).length,
      plansStoryboard: v.reduce((n, x) => n + x.storyboard.length, 0),
      qcm: c.qcm.length ? Math.max(...c.qcm.map((x) => x.note)) : null,
      fonctions,
      modifieLe: d.modifieLe,
    };
  }

  // ---------- Alertes (« À regarder ») ----------

  // Ce que le professeur doit regarder pendant la séance ; jamais d'alerte en rouge (ambre à l'écran).
  //   aujourdhui : 'AAAA-MM-JJ' ; seanceClasse : n° de la séance du jour pour la classe (facultatif)
  function alertes(d, res, ctx, aujourdhui) {
    const liste = [];
    const actifAujourdhui = jourDe(d.modifieLe) === aujourdhui;
    const seances = d.ecurie.seances;
    const derniere = seances[seances.length - 1];
    if (!d.ecurie.nom || !res.chef || !res.reporter) liste.push({ sorte: 'ecurie', texte: 'Écurie pas encore complète (nom, chef de projet, reporter)' });
    if (actifAujourdhui && !(derniere && derniere.depart && jourDe(derniere.depart.date) === aujourdhui)) liste.push({ sorte: 'depart', texte: 'Pas encore de point de départ aujourd’hui' });
    for (const s of seances.filter((x) => x.fin)) {
      const r = d.ecurie.rapports.find((x) => x.seance === s.numero);
      if (!r || !r.remisLe) liste.push({ sorte: 'rapport', texte: `Rapport de la séance ${s.numero} pas remis` });
    }
    if (derniere && derniere.fin && derniere.fin.bloquant) liste.push({ sorte: 'bloque', texte: `Bloqué : ${derniere.fin.bloquant}` });
    const circuit = K.circuit(ctx.calendrier, d.equipe.classe);
    const numero = derniere ? derniere.numero : 0;
    if (!res.affiches && numero >= circuit.seanceAffiche - 1) liste.push({ sorte: 'affiche', texte: `Affiche pas déposée (à rendre en séance ${circuit.seanceAffiche})` });
    // Un équipier qui essaie sans réussir le même exercice depuis un moment.
    for (const p of d.equipe.eleves) {
      const rubrique = d.ecurie.permis[p] && d.ecurie.permis[p].programmation;
      const id = rubrique && rubrique.exerciceCourant;
      const e = id && rubrique.exercices[id];
      if (!e || e.statut === 'reussi') continue;
      const echecs = (e.historique || []).filter((h) => h.type === 'verification' && !h.reussi).length;
      if (echecs >= 6) {
        const ex = ctx.paquets.permis.exercices.find((x) => x.id === id);
        liste.push({ sorte: 'exercice', texte: `${p} : exercice ${ex ? ex.numero : id}, ${echecs} vérifications sans réussite` });
      }
    }
    return liste;
  }

  // ---------- Indices pour noter (ce que l'outil constate, sous chaque critère) ----------

  function indices(res, ctx) {
    const moyennePermis = res.permis.length ? res.permis.reduce((s, x) => s + x.reussis, 0) / res.permis.length : 0;
    const total = ctx.paquets.permis.exercices.length;
    return {
      programme: `Permis : ${res.permis.map((x) => `${x.prenom} ${x.reussis}/${total}`).join(', ')} (moyenne ${String(Math.round(moyennePermis * 10) / 10).replace('.', ',')}) · défis prêts ${res.defisPrets}/${res.defisTotal}`,
      tests: `${res.essais} essai(s) noté(s), dont ${res.essaisAvecHypothese} avec une hypothèse`,
      chaines: `QCM : ${res.qcm === null ? 'pas fait' : String(res.qcm).replace('.', ',') + '/20'} · ${res.fonctions}/7 fonctions expliquées`,
      affiche: `${res.affiches} version(s) déposée(s) · contrôle ${res.afficheControle}/${ctx.livrables.affiche.controle.length}`,
      style: `${res.pieces} pièce(s) 3D · ${res.photosStyle} photo(s) · cahier des charges ${res.cahier}/${ctx.livrables.style.cahierDesCharges.length} · défilé ${res.defileEcrit ? 'écrit' : 'pas écrit'}`,
      videos: `${res.plansStoryboard} plan(s) de storyboard · ${res.videosDeposees}/2 vidéo(s) déposée(s)`,
      projet: `${res.seancesFinies} séance(s) avec point de fin · ${res.rapportsRemis} rapport(s) remis`,
    };
  }

  // ---------- Notes ----------

  function evaluationsVides(classe) {
    return { format: FORMAT_EVALUATIONS, version: 1, classe: classe || '', coefficients: {}, ecuries: {} };
  }

  function lireEvaluations(texte) {
    let x;
    try {
      x = JSON.parse(String(texte).replace(/^﻿/, ''));
    } catch {
      return { ok: false, raison: 'Ce fichier d’évaluations est illisible.' };
    }
    if (!x || x.format !== FORMAT_EVALUATIONS) return { ok: false, raison: 'Ce fichier n’est pas un fichier d’évaluations du mBot Challenge.' };
    if (x.version > 1) return { ok: false, raison: 'Ce fichier vient d’une version plus récente de l’outil.' };
    x.coefficients = x.coefficients || {};
    x.ecuries = x.ecuries || {};
    return { ok: true, evaluations: x };
  }

  function evaluationDe(ev, cle) {
    ev.ecuries[cle] = ev.ecuries[cle] || { niveaux: {}, commentaire: '', ajustements: {}, points: {} };
    return ev.ecuries[cle];
  }

  const coefficient = (ev, notation, c) => (ev.coefficients[c.id] !== undefined ? ev.coefficients[c.id] : c.coefficient);

  // Note de groupe sur 20 : seuls les critères évalués comptent (un livrable pas encore évalué reste hors du total).
  //   { note (ou null), evalues, total }
  function noteGroupe(ev, notation, cle) {
    const e = evaluationDe(ev, cle);
    let points = 0, max = 0, evalues = 0;
    for (const c of notation.criteres) {
      const k = coefficient(ev, notation, c);
      const n = e.niveaux[c.id];
      if (!k || !n) continue;
      points += k * n;
      max += k * 4;
      evalues++;
    }
    return { note: max ? Math.round((points / max) * 20 * 2) / 2 : null, evalues, total: notation.criteres.filter((c) => coefficient(ev, notation, c)).length };
  }

  // Note de chaque élève : note de groupe + ajustement (borné), entre 0 et 20.
  function notesEleves(ev, notation, cle, eleves) {
    const g = noteGroupe(ev, notation, cle).note;
    const e = evaluationDe(ev, cle);
    return eleves.map((p) => {
      const a = e.ajustements[p] || { valeur: 0, motif: '' };
      const valeur = Math.max(-notation.ajustementMax, Math.min(notation.ajustementMax, Number(a.valeur) || 0));
      return { prenom: p, ajustement: valeur, motif: a.motif || '', note: g === null ? null : Math.max(0, Math.min(20, g + valeur)) };
    });
  }

  // ---------- Exports ----------

  const nomNiveau = (notation, n) => (notation.niveaux.find((x) => x.valeur === n) || { nom: '' }).nom;

  // Une ligne par élève : classe, écurie, élève, rôles, niveaux, note de groupe, ajustement, motif, note.
  function lignesEleves(ecuries, ev, notation) {
    const lignes = [];
    for (const x of ecuries) {
      const d = x.donnees;
      const g = noteGroupe(ev, notation, x.cle).note;
      const e = evaluationDe(ev, x.cle);
      for (const n of notesEleves(ev, notation, x.cle, d.equipe.eleves)) {
        const roles = ((d.ecurie.roles || {})[n.prenom] || []).map((id) => (P.ROLES.find((r) => r.id === id) || { nom: id }).nom).join(', ');
        lignes.push([d.equipe.classe, P.nomAffiche(d), n.prenom, roles, ...notation.criteres.map((c) => nomNiveau(notation, e.niveaux[c.id])), g === null ? '' : g, n.ajustement || '', n.motif, n.note === null ? '' : n.note]);
      }
    }
    return { entete: ['Classe', 'Écurie', 'Élève', 'Rôles', ...notation.criteres.map((c) => c.nom), 'Note du groupe /20', 'Ajustement', 'Motif', 'Note /20'], lignes };
  }

  // Pronote : une ligne par élève, chaque compétence au vocabulaire de Pronote.
  function lignesPronote(ecuries, ev, notation) {
    const lignes = [];
    for (const x of ecuries) {
      const e = evaluationDe(ev, x.cle);
      for (const n of notesEleves(ev, notation, x.cle, x.donnees.equipe.eleves)) {
        lignes.push([x.donnees.equipe.classe, n.prenom, ...notation.criteres.map((c) => nomNiveau(notation, e.niveaux[c.id])), n.note === null ? '' : n.note]);
      }
    }
    return { entete: ['Classe', 'Élève', ...notation.criteres.map((c) => c.pronote), 'Note /20'], lignes };
  }

  // CSV pour Excel (France) : séparateur « ; », guillemets, BOM ajouté au téléchargement.
  function csv(tableau) {
    const cellule = (v) => {
      const t = v === null || v === undefined ? '' : typeof v === 'number' ? String(v).replace('.', ',') : String(v);
      return /[;"\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
    };
    return [tableau.entete, ...tableau.lignes].map((l) => l.map(cellule).join(';')).join('\r\n');
  }

  const api = {
    FORMAT_EVALUATIONS,
    cleEcurie,
    lireEcuries,
    resumer,
    alertes,
    indices,
    evaluationsVides,
    lireEvaluations,
    evaluationDe,
    coefficient,
    noteGroupe,
    notesEleves,
    lignesEleves,
    lignesPronote,
    csv,
  };
  if (enNode) module.exports = api;
  else Object.assign((global.Atelier = global.Atelier || {}), { classe: api });
})(this);
